"""Postmortem Agent — generates auditable postmortem documents."""

import logging
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.ai.gemini_client import GeminiReasoningClient
from deployguard.cloud.interfaces import DocumentStore
from deployguard.cloud.stubs import MockFirestore
from deployguard.state.workflow import PostmortemReport

logger = logging.getLogger(__name__)


class PostmortemAgent(BaseDeployGuardAgent):
    """Generates structured SRE postmortem reports combining deterministic facts and LLM reasoning.

    Phase 6: Complete implementation generating structured PostmortemReport documents.
    """

    def __init__(
        self,
        llm_client: GeminiReasoningClient | None = None,
        document_store: DocumentStore | None = None,
    ) -> None:
        super().__init__(
            name="postmortem_agent",
            agent_id="postmortem-v1",
        )
        self._llm_client = llm_client or GeminiReasoningClient()
        self._document_store = document_store or MockFirestore()

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("PostmortemAgent — synthesizing postmortem report")
        state = self.get_workflow_state(ctx)
        if not state:
            logger.warning("No workflow state found in context")
            yield Event(
                author=self.name,
                content=Content(parts=[Part(text="No active deployment workflow state found.")]),  # type: ignore
            )
            return

        now = datetime.now(UTC)
        service_name = state.service_name
        deployment_id = state.deployment_id
        target_version = state.version
        stable_version = state.rollback_target_version or "v1.0.0-stable"
        report_id = f"pm-{service_name}-{deployment_id[:8] if len(deployment_id) >= 8 else deployment_id}"

        # 1. Determine severity and outcome
        severity = state.anomaly_signal.severity if state.anomaly_signal else "HIGH"
        if state.recovery_verdict == "recovered":
            outcome = "recovered"
        elif state.pipeline_status == "failed":
            outcome = "failed_rollback"
        elif state.decision_trace and not state.decision_trace.authorized:
            outcome = "policy_blocked"
        else:
            outcome = "recovered"

        duration = max(1.0, (now - state.deployed_at).total_seconds())

        # 2. Extract telemetry metric deltas
        metric_deltas: dict[str, dict[str, Any]] = {}
        affected_metrics: list[str] = []
        if state.anomaly_signal:
            affected_metrics = state.anomaly_signal.affected_metrics
            for ev in state.anomaly_signal.evidence:
                metric_name = ev.get("metric", "unknown")
                metric_deltas[metric_name] = {
                    "baseline": ev.get("baseline", 0.0),
                    "current": ev.get("current", 0.0),
                    "ratio": ev.get("ratio", 1.0),
                }

        # 3. Build timeline events
        timeline_events = [
            {
                "timestamp": state.deployed_at.strftime("%H:%M:%S UTC"),
                "stage": "DEPLOYMENT",
                "description": f"Deployment initiated for {service_name} version {target_version}",
            }
        ]
        if state.anomaly_signal:
            timeline_events.append({
                "timestamp": state.anomaly_signal.detected_at.strftime("%H:%M:%S UTC"),
                "stage": "ANOMALY_DETECTED",
                "description": f"Anomaly detected ({severity}) affecting: {', '.join(affected_metrics)}",
            })
        if state.decision_trace:
            timeline_events.append({
                "timestamp": state.decision_trace.decided_at.strftime("%H:%M:%S UTC"),
                "stage": "DECISION_EVALUATED",
                "description": f"Decision: {state.decision_trace.decision} (Confidence: {state.decision_trace.confidence:.2f})",
            })
        if state.rollback_executed:
            timeline_events.append({
                "timestamp": (state.recovery_checked_at or now).strftime("%H:%M:%S UTC"),
                "stage": "ROLLBACK_EXECUTED",
                "description": f"Rollback executed to {stable_version} (Op ID: {state.rollback_operation_id or 'op-sync'})",
            })
        if state.recovery_verdict:
            timeline_events.append({
                "timestamp": (state.recovery_checked_at or now).strftime("%H:%M:%S UTC"),
                "stage": "RECOVERY_VERIFIED",
                "description": f"Recovery verification completed with verdict: {state.recovery_verdict}",
            })

        # 4. Summaries
        decision_summary = {}
        if state.decision_trace:
            decision_summary = {
                "decision": state.decision_trace.decision,
                "confidence": state.decision_trace.confidence,
                "policy_passed": state.decision_trace.policy_passed,
                "authorized": state.decision_trace.authorized,
                "reason": state.decision_trace.authorization_reason,
            }

        rollback_summary = {
            "authorized": state.rollback_authorized,
            "executed": state.rollback_executed,
            "target_version": stable_version,
            "operation_id": state.rollback_operation_id,
            "verdict": state.recovery_verdict,
        }

        # 5. Narrative generation with graceful fallback (D-01, D-03)
        incident_context = {
            "service_name": service_name,
            "severity": severity,
            "target_version": target_version,
            "stable_version": stable_version,
            "outcome": outcome,
            "affected_metrics": affected_metrics,
            "decision_rationale": state.decision_trace.authorization_reason if state.decision_trace else "Automatic anomaly remediation",
        }

        try:
            narrative = await self._llm_client.generate_postmortem_narrative(incident_context)
            executive_summary = narrative.get("executive_summary", "")
            root_cause_analysis = narrative.get("root_cause_analysis", "")
            preventative_actions = narrative.get("preventative_actions", [])
        except Exception as e:
            logger.warning("LLM postmortem generation failed, falling back to deterministic synthesis: %s", e)
            executive_summary = (
                f"During deployment of {service_name} ({target_version}), automated monitoring detected a "
                f"{severity} anomaly on {', '.join(affected_metrics) or 'telemetry metrics'}. Autonomous decisioning "
                f"executed rollback to stable version {stable_version}. Post-rollback verification status: {outcome}."
            )
            root_cause_analysis = (
                f"1. Why did the incident occur? Deployment {target_version} introduced metric anomalies.\n"
                f"2. Why were metrics impacted? Performance regression under production traffic.\n"
                f"3. Why was it not caught earlier? Staging tests did not replicate full load profiles.\n"
                f"4. Why was blast radius contained? DeployGuard detected failure and triggered rollback.\n"
                f"5. Why was recovery verified? Metric thresholds returned to baseline levels post-rollback."
            )
            preventative_actions = [
                f"Add load test suites for {service_name} covering {', '.join(affected_metrics) or 'key metrics'}.",
                "Review canary deployment progression gates in CI/CD pipeline.",
                "Verify resource limits and scaling configurations in Cloud Run/GKE manifests."
            ]

        # 6. Extract Trace ID
        trace_context = ctx.session.state.get("trace_context", {}) if hasattr(ctx, "session") and hasattr(ctx.session, "state") else {}
        trace_id = trace_context.get("trace_id") if isinstance(trace_context, dict) else None
        if not trace_id and state.decision_trace:
            trace_id = state.decision_trace.trace_id

        # 7. Construct PostmortemReport model
        report = PostmortemReport(
            report_id=report_id,
            deployment_id=deployment_id,
            service_name=service_name,
            created_at=now,
            target_version=target_version,
            stable_version=stable_version,
            incident_duration_seconds=duration,
            severity=severity,  # type: ignore
            outcome=outcome,  # type: ignore
            executive_summary=executive_summary,
            root_cause_analysis=root_cause_analysis,
            timeline_events=timeline_events,
            metric_deltas=metric_deltas,
            decision_summary=decision_summary,
            rollback_summary=rollback_summary,
            preventative_actions=preventative_actions,
            trace_id=trace_id,
        )

        # 8. Persist to Firestore & WorkflowState
        await self._document_store.set_document("postmortems", report_id, report.model_dump(mode="json"))
        state.postmortem_id = report_id
        state.postmortem_report = report
        self.set_workflow_state(ctx, state)

        logger.info("PostmortemAgent — report %s saved successfully", report_id)
        yield Event(
            author=self.name,
            content=Content(parts=[Part(text=f"Postmortem report generated: {report_id}\n\n{report.to_markdown()}")]),  # type: ignore
        )
