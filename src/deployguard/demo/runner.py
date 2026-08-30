"""DeployGuard End-to-End Demonstration Orchestrator."""

import argparse
import asyncio
import time
from datetime import UTC, datetime
from typing import Any, Literal

from deployguard.agents.decision import DecisionAgent
from deployguard.agents.deploy_monitor import DeployMonitorAgent
from deployguard.agents.incident_memory import IncidentMemoryAgent
from deployguard.agents.postmortem import PostmortemAgent
from deployguard.agents.rollback import RollbackAgent
from deployguard.api.events import broadcaster
from deployguard.cloud.stubs import (
    MockMonitoring,
)
from deployguard.demo.clean import reset_demo_state
from deployguard.demo.scenarios import (
    MockContext,
    run_gateway_denial_scenario,
    run_prompt_injection_scenario,
)
from deployguard.demo.ui import (
    DIM,
    FG_BRIGHT_CYAN,
    FG_BRIGHT_GREEN,
    FG_BRIGHT_MAGENTA,
    FG_BRIGHT_RED,
    FG_BRIGHT_YELLOW,
    RESET,
    print_agent_thought,
    print_header,
    print_metric_table,
    print_stage_banner,
    prompt_step,
)
from deployguard.state.workflow import DeploymentWorkflowState


class DemoRunner:
    """Coordinates the execution of the DeployGuard end-to-end demo lifecycle."""

    def __init__(self, interactive: bool = True, session_id: str | None = None) -> None:
        self.interactive = interactive
        self.session_id = session_id or f"deploy-demo-{int(time.time())}"
        self.service_name = "checkout-service"
        self.target_version = "v2.4.0"
        self.stable_version = "v2.3.9"
        self.environment: Literal["development", "staging", "production"] = "production"

        # Telemetry baselines
        self.baseline_metrics = {
            "error_rate": 0.01,
            "latency": 95.0,
            "crash_rate": 0.0,
            "cpu": 0.32,
            "memory": 0.45,
            "restarts": 0.0,
            "request_rate": 650.0,
        }

        # Anomalous failure metrics
        self.anomalous_metrics = {
            "error_rate": 0.125,
            "latency": 540.0,
            "crash_rate": 0.04,
            "cpu": 0.88,
            "memory": 0.92,
            "restarts": 4.0,
            "request_rate": 620.0,
        }

        # Recovered metrics (post-rollback)
        self.recovered_metrics = {
            "error_rate": 0.011,
            "latency": 98.0,
            "crash_rate": 0.0,
            "cpu": 0.34,
            "memory": 0.46,
            "restarts": 0.0,
            "request_rate": 655.0,
        }

    async def run_full_lifecycle(self) -> DeploymentWorkflowState:
        """Run all 8 stages of the autonomous recovery lifecycle."""
        print_header(
            "DEPLOYGUARD AUTONOMOUS SRE FLEET DEMONSTRATION",
            f"Session ID: {self.session_id} | Target: {self.service_name}:{self.target_version}",
        )

        # Setup monitoring stub
        monitoring_source = MockMonitoring()
        for k, v in self.baseline_metrics.items():
            monitoring_source.set_baseline(k, v)
            monitoring_source.set_metric(k, v)

        # Initialize workflow state
        state = DeploymentWorkflowState(
            deployment_id=self.session_id,
            service_name=self.service_name,
            version=self.target_version,
            environment=self.environment,
            deployed_at=datetime.now(UTC),
            pipeline_status="monitoring",
            baseline_metrics=self.baseline_metrics,
            rollback_target_version=self.stable_version,
        )
        ctx: Any = MockContext(state)

        # ---------------------------------------------------------------------
        # STAGE 1: Deployment Initiation
        # ---------------------------------------------------------------------
        print_stage_banner(1, "Deployment Initiation", "Cloud Deploy", FG_BRIGHT_CYAN)
        print(f"  [Release Engine] Target Service: {self.service_name}")
        print(
            f"  [Release Engine] Injected Version: {self.target_version} (Candidate Rollout)"
        )
        print(f"  [Release Engine] Environment: {self.environment}")
        print(
            "  [Release Engine] Baseline Status: Stable (Error Rate 1.0%, Latency p95 95ms)\n"
        )

        await broadcaster.broadcast(
            "deployment_initiated",
            {
                "deployment_id": self.session_id,
                "service_name": self.service_name,
                "version": self.target_version,
                "environment": self.environment,
                "status": "monitoring",
            },
        )

        prompt_step("Stage 2 (Telemetry Failure Injection)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 2: Metric Failure Injection
        # ---------------------------------------------------------------------
        print_stage_banner(
            2, "Metric Failure Injection", "Telemetry Harness", FG_BRIGHT_RED
        )
        print(
            "  [Simulator] Injecting production regression (memory leak + thread exhaustion)..."
        )

        for k, v in self.anomalous_metrics.items():
            monitoring_source.set_metric(k, v)

        print_metric_table(self.baseline_metrics, self.anomalous_metrics)

        await broadcaster.broadcast(
            "metric_tick",
            {
                "service_name": self.service_name,
                "metrics": self.anomalous_metrics,
                "anomalous": True,
            },
        )

        prompt_step("Stage 3 (Deploy Monitor Anomaly Detection)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 3: Anomaly Detection
        # ---------------------------------------------------------------------
        print_stage_banner(
            3, "Anomaly Detection & Baseline Diff", "DeployMonitorAgent", FG_BRIGHT_CYAN
        )

        monitor_agent = DeployMonitorAgent(metrics_source=monitoring_source)
        monitor_agent.set_workflow_state(ctx, state)

        async for event in monitor_agent._execute(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = monitor_agent.get_workflow_state(ctx) or state

        print_agent_thought(
            "DeployMonitorAgent",
            "Observed error_rate (+1150%) and latency_p95 (+468%) breaching critical thresholds.\n"
            "Flagged AnomalySignal(severity='CRITICAL', confidence=0.96). Yielding to IncidentMemoryAgent.",
            FG_BRIGHT_CYAN,
        )

        await broadcaster.broadcast(
            "anomaly_detected",
            {
                "deployment_id": self.session_id,
                "severity": "CRITICAL",
                "confidence": 0.96,
                "anomalies": state.anomaly_signal.affected_metrics
                if state.anomaly_signal
                else [],
            },
        )

        prompt_step("Stage 4 (Incident Memory Investigation)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 4: Incident Memory Investigation
        # ---------------------------------------------------------------------
        print_stage_banner(
            4, "Incident Memory Vector Search", "IncidentMemoryAgent", FG_BRIGHT_MAGENTA
        )

        memory_agent = IncidentMemoryAgent()
        memory_agent.set_workflow_state(ctx, state)

        async for event in memory_agent._execute(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = memory_agent.get_workflow_state(ctx) or state

        print_agent_thought(
            "IncidentMemoryAgent",
            "Matched past incident: INC-2026-0819 ('High threadpool latency following checkout release').\n"
            "Historical resolution: Approved rollback to prior stable version. Similarity score: 0.91.",
            FG_BRIGHT_MAGENTA,
        )

        await broadcaster.broadcast(
            "memory_retrieved",
            {
                "deployment_id": self.session_id,
                "matched_incidents": 1,
                "top_match": "INC-2026-0819",
                "similarity": 0.91,
            },
        )

        prompt_step("Stage 5 (Governed Decisioning Engine)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 5: Governed Decisioning Engine
        # ---------------------------------------------------------------------
        print_stage_banner(
            5, "Governed Decision & Policy Gate", "DecisionAgent", FG_BRIGHT_YELLOW
        )

        decision_agent = DecisionAgent()
        decision_agent.set_workflow_state(ctx, state)

        async for event in decision_agent._execute(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = decision_agent.get_workflow_state(ctx) or state

        print_agent_thought(
            "DecisionAgent",
            "Evaluated evidence against deterministic PolicyEngine:\n"
            "  ✓ Confidence Check: 0.94 >= 0.80 (PASSED)\n"
            "  ✓ Severity Threshold: CRITICAL >= HIGH (PASSED)\n"
            "  ✓ Deployment Age: 180s <= 1800s (PASSED)\n"
            "  ✓ Stable Target: v2.3.9 available in Cloud Deploy (PASSED)\n"
            "Verdict: ROLLBACK AUTHORIZED. Emitting DecisionTrace.",
            FG_BRIGHT_YELLOW,
        )

        await broadcaster.broadcast(
            "decision_evaluated",
            {
                "deployment_id": self.session_id,
                "action": "rollback",
                "confidence": 0.94,
                "policy_passed": True,
                "authorized": True,
            },
        )

        prompt_step("Stage 6 (Rollback Execution)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 6: Rollback Execution
        # ---------------------------------------------------------------------
        print_stage_banner(
            6, "Governed Rollback Execution", "RollbackAgent", FG_BRIGHT_RED
        )

        rollback_agent = RollbackAgent()
        rollback_agent.set_workflow_state(ctx, state)

        async for event in rollback_agent._execute(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = rollback_agent.get_workflow_state(ctx) or state

        print_agent_thought(
            "RollbackAgent",
            f"Validated gateway authorization. Initiated Cloud Deploy rollback to target version {self.stable_version}.\n"
            f"Operation ID: {state.rollback_operation_id}. Pipeline status transitioned to verifying_recovery.",
            FG_BRIGHT_RED,
        )

        await broadcaster.broadcast(
            "rollback_initiated",
            {
                "deployment_id": self.session_id,
                "target_version": self.stable_version,
                "operation_id": state.rollback_operation_id,
            },
        )

        prompt_step("Stage 7 (Multi-Iteration Recovery Verification)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 7: Recovery Verification
        # ---------------------------------------------------------------------
        print_stage_banner(
            7, "Recovery Verification Loop", "DeployMonitorAgent", FG_BRIGHT_GREEN
        )
        print(
            "  [Simulator] Rollback completed. Simulating metric normalization across pods..."
        )

        for k, v in self.recovered_metrics.items():
            monitoring_source.set_metric(k, v)

        monitor_agent = DeployMonitorAgent(
            metrics_source=monitoring_source,
            stabilization_delay=0.0,
            sampling_iterations=3,
            sampling_interval=0.0,
        )
        monitor_agent.set_workflow_state(ctx, state)

        async for event in monitor_agent.verify_recovery(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = monitor_agent.get_workflow_state(ctx) or state

        print_metric_table(
            self.baseline_metrics, self.anomalous_metrics, self.recovered_metrics
        )

        print_agent_thought(
            "DeployMonitorAgent",
            "Sampled 3/3 intervals: all 7 metrics within 15% baseline delta.\n"
            "Recovery verdict: RECOVERED. Production health restored.",
            FG_BRIGHT_GREEN,
        )

        await broadcaster.broadcast(
            "recovery_verified",
            {
                "deployment_id": self.session_id,
                "verdict": "recovered",
                "samples_checked": 3,
            },
        )

        prompt_step("Stage 8 (SRE Postmortem Synthesis)", self.interactive)

        # ---------------------------------------------------------------------
        # STAGE 8: Postmortem Synthesis
        # ---------------------------------------------------------------------
        print_stage_banner(
            8, "Postmortem & Root Cause Synthesis", "PostmortemAgent", FG_BRIGHT_CYAN
        )

        postmortem_agent = PostmortemAgent()
        postmortem_agent.set_workflow_state(ctx, state)

        async for event in postmortem_agent._execute(ctx):
            if event.content and event.content.parts and event.content.parts[0].text:
                print(f"  ▶ {event.content.parts[0].text.strip()}")

        state = postmortem_agent.get_workflow_state(ctx) or state

        if state.postmortem_report:
            print(
                f"\n  {FG_BRIGHT_GREEN}✓ SRE Postmortem Document Generated and Saved to Firestore:{RESET}\n"
            )
            print(f"  {DIM}{'─' * 72}{RESET}")
            for line in state.postmortem_report.to_markdown().split("\n")[:22]:
                print(f"  {line}")
            print(
                f"  {DIM}... [Full report stored in Firestore collection 'postmortems']{RESET}"
            )
            print(f"  {DIM}{'─' * 72}{RESET}\n")

        await broadcaster.broadcast(
            "postmortem_generated",
            {
                "deployment_id": self.session_id,
                "report_id": state.postmortem_report.report_id
                if state.postmortem_report
                else "",
                "outcome": "recovered",
            },
        )

        print(
            f"{FG_BRIGHT_GREEN}✨ DEMONSTRATION COMPLETE: Full autonomous lifecycle verified successfully!{RESET}\n"
        )
        return state


def main() -> None:
    """CLI entrypoint for running DeployGuard demonstrations."""
    parser = argparse.ArgumentParser(description="DeployGuard Demo Orchestrator")
    parser.add_argument(
        "--interactive",
        action="store_true",
        default=True,
        help="Run in interactive mode with step pauses (default: True)",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Run in automated timed playback mode without keypresses",
    )
    parser.add_argument(
        "--ci",
        action="store_true",
        help="Run in fast non-interactive headless mode for CI",
    )
    parser.add_argument(
        "--scenario",
        choices=["all", "standard", "gateway", "injection", "security"],
        default="standard",
        help="Select demo scenario to run",
    )
    parser.add_argument(
        "--session-id",
        type=str,
        default=None,
        help="Custom deployment session ID",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Reset mock stores and state before running",
    )

    args = parser.parse_args()

    if args.clean:
        reset_demo_state()

    is_interactive = not (args.auto or args.ci)

    runner = DemoRunner(interactive=is_interactive, session_id=args.session_id)

    if args.scenario in ["standard", "all"]:
        asyncio.run(runner.run_full_lifecycle())

    if args.scenario in ["gateway", "security", "all"]:
        asyncio.run(run_gateway_denial_scenario(interactive=is_interactive))

    if args.scenario in ["injection", "security", "all"]:
        asyncio.run(run_prompt_injection_scenario(interactive=is_interactive))


if __name__ == "__main__":
    main()
