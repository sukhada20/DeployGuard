from datetime import UTC, datetime

import pytest

from deployguard.agents.incident_memory import IncidentMemoryAgent
from deployguard.cloud.stubs import MockFirestore
from deployguard.state.workflow import AnomalySignal, DeploymentWorkflowState


class MockSession:
    def __init__(self) -> None:
        self.state = {}


class MockInvocationContext:
    def __init__(self) -> None:
        self.session = MockSession()


@pytest.mark.asyncio
async def test_incident_memory_agent_no_past_incidents():
    # 1. Setup mock store
    store = MockFirestore()
    agent = IncidentMemoryAgent(document_store=store)
    ctx = MockInvocationContext()

    # 2. Setup state with anomaly signal
    state = DeploymentWorkflowState(
        deployment_id="dep-new",
        service_name="auth-service",
        version="1.1",
        deployed_at=datetime.now(UTC),
    )
    state.anomaly_signal = AnomalySignal(
        severity="HIGH",
        confidence=0.9,
        affected_metrics=["error_rate"],
        evidence=[],
        detected_at=datetime.now(UTC),
    )
    agent.set_workflow_state(ctx, state)

    # 3. Execute
    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    # 4. Verify current incident was written to Firestore
    written = await store.get_document("incidents", "dep-new")
    assert written is not None
    assert written["deployment_id"] == "dep-new"
    assert len(events) == 1
    assert "No similar incidents found in memory" in events[0].content.parts[0].text


@pytest.mark.asyncio
async def test_incident_memory_agent_retrieves_past_incidents():
    # 1. Setup mock store with a past incident
    store = MockFirestore()
    past_incident = {
        "deployment_id": "dep-old",
        "service_name": "auth-service",
        "version": "1.0",
        "deployed_at": "2026-08-23T10:00:00",
        "pipeline_status": "complete",
    }
    await store.set_document("incidents", "dep-old", past_incident)

    agent = IncidentMemoryAgent(document_store=store)
    ctx = MockInvocationContext()

    # 2. Setup state with anomaly signal
    state = DeploymentWorkflowState(
        deployment_id="dep-new",
        service_name="auth-service",
        version="1.1",
        deployed_at=datetime.now(UTC),
    )
    state.anomaly_signal = AnomalySignal(
        severity="HIGH",
        confidence=0.9,
        affected_metrics=["error_rate"],
        evidence=[],
        detected_at=datetime.now(UTC),
    )
    agent.set_workflow_state(ctx, state)

    # 3. Execute
    events = []
    async for event in agent._execute(ctx):
        events.append(event)

    # 4. Verify results
    assert len(events) == 1
    assert "Found 1 similar past incidents" in events[0].content.parts[0].text
    assert "dep-old" in events[0].content.parts[0].text
