"""Deploy Monitor Agent — monitors deployment health and verifies recovery."""

import asyncio
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
from deployguard.state.workflow import AnomalySignal, DeploymentWorkflowState

logger = logging.getLogger(__name__)

# Recovery tolerance ratio (D-04: max 1.15x baseline for healthy recovery)
RECOVERY_MAX_RATIO = 1.15


class DeployMonitorAgent(BaseDeployGuardAgent):
    """Monitors post-deployment metrics and verifies post-rollback recovery.

    Phase 2: Post-deployment anomaly detection and baseline comparison.
    Phase 5: Post-rollback recovery verification loop with multi-iteration sampling.
    """

    def __init__(
        self,
        metrics_source: MetricsSource | None = None,
        stabilization_delay: float = 0.0,
        sampling_iterations: int = 3,
        sampling_interval: float = 0.0,
    ) -> None:
        super().__init__(
            name="deploy_monitor",
            agent_id="deploy-monitor-v1",
        )
        self._metrics_source = metrics_source or MockMonitoring()
        self._stabilization_delay = stabilization_delay
        self._sampling_iterations = max(1, sampling_iterations)
        self._sampling_interval = sampling_interval

    @property
    def stabilization_delay(self) -> float:
        return self._stabilization_delay

    @property
    def sampling_iterations(self) -> int:
        return self._sampling_iterations

    @property
    def sampling_interval(self) -> float:
        return self._sampling_interval

    async def _execute(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
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

        # Route to recovery verification if pipeline is in verifying_recovery state
        if state.pipeline_status == "verifying_recovery":
            logger.info("DeployMonitorAgent — running post-rollback recovery verification")
            async for event in self.verify_recovery(ctx):
                yield event
            return

        logger.info("DeployMonitorAgent — monitoring deployment metrics")
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

    async def verify_recovery(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        """Execute post-rollback recovery verification loop (ROLL-02, D-03, D-04).

        1. Waits for stabilization cooldown delay.
        2. Samples telemetry over multiple iterations across all 7 metric dimensions.
        3. Evaluates strict recovery tolerance (ratios <= 1.15x baseline, 0 crashes/restarts).
        4. Updates workflow state with recovery verdict and timestamp.
        """
        state = self.get_workflow_state(ctx)
        if not state:
            yield Event(
                author=self.name,
                content=Content(
                    role="model", parts=[Part(text="Error: No workflow state found")]
                ),
            )
            return

        # 1. Stabilization delay (D-03)
        if self.stabilization_delay > 0:
            logger.info("Waiting %fs for system stabilization post-rollback...", self.stabilization_delay)
            await asyncio.sleep(self.stabilization_delay)

        # Baseline metrics reference (fall back to empty dict if missing)
        baselines = state.baseline_metrics or {}
        sample_results: list[list[dict]] = []
        is_inconclusive = False
        inconclusive_reason = ""

        # 2. Multi-iteration sampling loop
        for iteration in range(self.sampling_iterations):
            current_metrics: dict[str, float] = {}
            try:
                for metric in METRIC_THRESHOLDS:
                    val = await self._metrics_source.get_metric(metric)
                    if val is None:
                        is_inconclusive = True
                        inconclusive_reason = f"Missing metric data for '{metric}'"
                        break
                    current_metrics[metric] = float(val)

                if is_inconclusive:
                    break

                # If baselines not in state, fetch them now
                if not baselines:
                    for metric in METRIC_THRESHOLDS:
                        b_val = await self._metrics_source.get_baseline(metric)
                        baselines[metric] = float(b_val)
                    state.baseline_metrics = baselines

                evidence = compare_metrics(current_metrics, baselines)
                sample_results.append(evidence)

            except Exception as e:
                logger.warning("Recovery metric fetch error during iteration %d: %s", iteration, e)
                is_inconclusive = True
                inconclusive_reason = f"Telemetry fetch exception: {e}"
                break

            if self.sampling_interval > 0 and iteration < self.sampling_iterations - 1:
                await asyncio.sleep(self.sampling_interval)

        # 3. Evaluate recovery verdict (D-04)
        if is_inconclusive or not sample_results:
            verdict = "inconclusive"
            pipeline_status = "failed"
            summary = f"RECOVERY VERIFICATION INCONCLUSIVE: {inconclusive_reason}"
        else:
            # Check if any sample iteration is degraded
            degraded_metrics: set[str] = set()
            for evidence_list in sample_results:
                for item in evidence_list:
                    metric = item["metric"]
                    curr = item["current"]
                    base = item["baseline"]
                    ratio = item["ratio"]

                    # Crash/restart metrics must be 0
                    if metric in ("crash_rate", "restarts") and curr > 0.0:
                        degraded_metrics.add(metric)
                    # Other metrics must remain within recovery ratio threshold
                    elif ratio > RECOVERY_MAX_RATIO and item["anomalous"]:
                        degraded_metrics.add(metric)

            if degraded_metrics:
                verdict = "degraded"
                pipeline_status = "failed"
                summary = (
                    f"RECOVERY VERIFICATION DEGRADED: Metrics remain anomalous "
                    f"after rollback: {sorted(degraded_metrics)}"
                )
            else:
                verdict = "recovered"
                pipeline_status = "complete"
                summary = (
                    f"RECOVERY VERIFIED: All 7 metrics returned to stable baseline "
                    f"across {len(sample_results)} sampling iteration(s)."
                )

        # 4. Update workflow state
        state.recovery_verdict = verdict  # type: ignore
        state.recovery_checked_at = datetime.now(UTC)
        state.pipeline_status = pipeline_status  # type: ignore
        self.set_workflow_state(ctx, state)

        logger.info("Recovery verification finished: verdict=%s", verdict)
        yield Event(
            author=self.name,
            content=Content(role="model", parts=[Part(text=summary)]),
        )

