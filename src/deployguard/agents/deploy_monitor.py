"""Deploy Monitor Agent — monitors deployment health and detects anomalies."""

import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from google.adk.agents import InvocationContext
from google.adk.events.event import Event
from google.genai.types import Content, Part

from deployguard.agents.base import BaseDeployGuardAgent
from deployguard.cloud.interfaces import MetricsSource
from deployguard.cloud.metrics import METRIC_THRESHOLDS, compare_metrics
from deployguard.cloud.stubs import MockMonitoring
from deployguard.state.workflow import AnomalySignal

logger = logging.getLogger(__name__)


class DeployMonitorAgent(BaseDeployGuardAgent):
    """Monitors post-deployment metrics and produces anomaly signals.

    Phase 1: Stub implementation returns deterministic results from stub interfaces.
    Phase 2: Replaced with real Cloud Monitoring polling and baseline comparison.
    """

    def __init__(self, metrics_source: MetricsSource | None = None) -> None:
        super().__init__(
            name="deploy_monitor",
            agent_id="deploy-monitor-v1",
        )
        self._metrics_source = metrics_source or MockMonitoring()

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info("DeployMonitorAgent — monitoring deployment metrics")
        state = self.get_workflow_state(ctx)
        if not state:
            logger.warning("No workflow state found in context")
            yield Event(
                author=self.name,
                content=Content(
                    role="model", parts=[Part(text="Error: No workflow state found")]
                ),
            )
            return

        state.pipeline_status = "monitoring"
        self.set_workflow_state(ctx, state)

        # 1. Fetch current and baseline metrics for all monitored metrics
        current_metrics = {}
        baseline_metrics = {}

        for metric in METRIC_THRESHOLDS:
            current_metrics[metric] = await self._metrics_source.get_metric(metric)
            baseline_metrics[metric] = await self._metrics_source.get_baseline(metric)

        # 2. Compare metrics using the ratio-threshold comparison engine
        evidence = compare_metrics(current_metrics, baseline_metrics)
        anomalous_evidence = [e for e in evidence if e["anomalous"]]

        state.current_metrics = current_metrics
        state.baseline_metrics = baseline_metrics

        if anomalous_evidence:
            # Anomaly detected!
            affected = [e["metric"] for e in anomalous_evidence]

            # Simple severity heuristics
            if "error_rate" in affected or "crash_rate" in affected:
                severity = "CRITICAL"
            elif "latency" in affected or "restarts" in affected:
                severity = "HIGH"
            else:
                severity = "MEDIUM"

            signal = AnomalySignal(
                severity=severity,
                confidence=0.95,
                affected_metrics=affected,
                evidence=anomalous_evidence,
                detected_at=datetime.now(UTC),
            )

            state.anomaly_signal = signal
            state.pipeline_status = "anomaly_detected"
            self.set_workflow_state(ctx, state)

            logger.info("Anomaly detected: %s (affected: %s)", severity, affected)
            msg = (
                f"ANOMALY DETECTED: Severity {severity}, "
                f"affected metrics: {affected}"
            )
            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[Part(text=msg)],
                ),
            )
        else:
            # Healthy
            self.set_workflow_state(ctx, state)
            logger.info("Deployment metrics are healthy")
            yield Event(
                author=self.name,
                content=Content(
                    role="model",
                    parts=[Part(text="Monitoring complete — no anomaly detected")],
                ),
            )
