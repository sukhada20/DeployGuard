"""Unit and integration tests for Postmortem Agent and PostmortemReport."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
import pytest

from google.adk.agents import InvocationContext
from google.adk.sessions import Session

from deployguard.agents.postmortem import PostmortemAgent
from deployguard.ai.gemini_client import GeminiReasoningClient
from deployguard.cloud.stubs import MockFirestore
from deployguard.state.workflow import (
    AnomalySignal,
    DecisionTrace,
    DeploymentWorkflowState,
    PostmortemReport,
)


@pytest.fixture
def mock_session() -> Session:
    """Creates a mock ADK session with pre-populated incident workflow state."""
    state = DeploymentWorkflowState(
        deployment_id="dep-12345678-abc",
        service_name="checkout-service",
        version="v2.1.0",
        environment="production",
        deployed_at=datetime.now(UTC),
        pipeline_status="complete",
        anomaly_signal=AnomalySignal(
            severity="CRITICAL",
            confidence=0.95,
            affected_metrics=["error_rate", "latency_p95"],
            evidence=[
                {"metric": "error_rate", "baseline": 0.01, "current": 0.15, "ratio": 15.0},
                {"metric": "latency_p95", "baseline": 120.0, "current": 480.0, "ratio": 4.0},
            ],
            detected_at=datetime.now(UTC),
        ),
        decision_trace=DecisionTrace(
            trace_id="tr-8888",
            decision="rollback",
            confidence=0.92,
            evidence_summary="Error rate spiked 15x above baseline",
            policy_checks={"confidence_check": True, "severity_check": True, "environment_check": True},
            policy_passed=True,
            authorized=True,
            authorization_reason="Critical error spike meets auto-rollback policy",
            decided_at=datetime.now(UTC),
        ),
        rollback_authorized=True,
        rollback_executed=True,
        rollback_target_version="v2.0.9",
        rollback_operation_id="op-cloud-deploy-99",
        recovery_verdict="recovered",
        recovery_checked_at=datetime.now(UTC),
    )
    session = MagicMock(spec=Session)
    session.state = {"workflow_state": state.to_session_dict(), "trace_context": {"trace_id": "trace-global-123"}}
    return session


@pytest.fixture
def invocation_context(mock_session: Session) -> InvocationContext:
    ctx = MagicMock(spec=InvocationContext)
    ctx.session = mock_session
    return ctx


def test_postmortem_report_schema_and_markdown():
    """Test PostmortemReport model fields and SRE markdown serialization."""
    report = PostmortemReport(
        report_id="pm-checkout-service-dep-1234",
        deployment_id="dep-12345678-abc",
        service_name="checkout-service",
        created_at=datetime.now(UTC),
        target_version="v2.1.0",
        stable_version="v2.0.9",
        incident_duration_seconds=42.5,
        severity="CRITICAL",
        outcome="recovered",
        executive_summary="Incident resulted in automated rollback to restore health.",
        root_cause_analysis="1. Why? Memory leak.\n2. Why? Unbounded cache.",
        metric_deltas={
            "error_rate": {"baseline": 0.01, "current": 0.15, "ratio": 15.0},
        },
        timeline_events=[
            {"timestamp": "12:00:00 UTC", "stage": "DEPLOYMENT", "description": "Deployment started"},
            {"timestamp": "12:00:15 UTC", "stage": "ANOMALY_DETECTED", "description": "Error spike detected"},
        ],
        decision_summary={"decision": "rollback", "confidence": 0.92, "policy_passed": True},
        rollback_summary={"operation_id": "op-1", "target_version": "v2.0.9"},
        preventative_actions=["Add memory leak integration test", "Review cache expiry settings"],
        trace_id="trace-global-123",
    )

    md = report.to_markdown()
    assert "# Incident Postmortem: checkout-service" in md
    assert "**Severity:** `CRITICAL`" in md
    assert "## Executive Summary" in md
    assert "## Root Cause Analysis (5 Whys)" in md
    assert "## Anomaly & Telemetry Evidence" in md
    assert "| error_rate |" in md
    assert "## Incident Timeline" in md
    assert "## Preventative Action Items" in md
    assert "- [ ] Add memory leak integration test" in md


@pytest.mark.asyncio
async def test_postmortem_agent_execution_and_storage(invocation_context: InvocationContext):
    """Test PostmortemAgent runs, yields event, updates state, and saves to Firestore."""
    store = MockFirestore()
    agent = PostmortemAgent(document_store=store)

    events = []
    async for event in agent._execute(invocation_context):
        events.append(event)

    assert len(events) == 1
    event_text = events[0].content.parts[0].text
    assert "Postmortem report generated:" in event_text
    assert "# Incident Postmortem: checkout-service" in event_text

    # Verify Firestore document
    state_dict = invocation_context.session.state["workflow_state"]
    updated_state = DeploymentWorkflowState.from_session_dict(state_dict)
    assert updated_state.postmortem_id is not None
    assert updated_state.postmortem_report is not None
    assert updated_state.postmortem_report.outcome == "recovered"
    assert updated_state.postmortem_report.severity == "CRITICAL"

    doc = await store.get_document("postmortems", updated_state.postmortem_id)
    assert doc is not None
    assert doc["service_name"] == "checkout-service"
    assert doc["target_version"] == "v2.1.0"
    assert doc["stable_version"] == "v2.0.9"


@pytest.mark.asyncio
async def test_postmortem_agent_deterministic_fallback(invocation_context: InvocationContext):
    """Test PostmortemAgent falls back gracefully when LLM raises an error."""
    mock_llm = MagicMock(spec=GeminiReasoningClient)
    mock_llm.generate_postmortem_narrative = AsyncMock(side_effect=RuntimeError("Gemini API connection error"))

    store = MockFirestore()
    agent = PostmortemAgent(llm_client=mock_llm, document_store=store)

    events = []
    async for event in agent._execute(invocation_context):
        events.append(event)

    assert len(events) == 1
    event_text = events[0].content.parts[0].text
    assert "Postmortem report generated:" in event_text

    state_dict = invocation_context.session.state["workflow_state"]
    updated_state = DeploymentWorkflowState.from_session_dict(state_dict)
    assert updated_state.postmortem_report is not None
    assert "Why did the incident occur?" in updated_state.postmortem_report.root_cause_analysis
