import json
from typing import Any, Dict

class ModelArmorFilter:
    """Mock Model Armor wrapper to screen prompt inputs and model outputs."""

    INJECTION_KEYWORDS = [
        "ignore previous instructions",
        "system override",
        "bypass security policies",
        "you are now an admin"
    ]

    def screen_text(self, text: str) -> str:
        """Screens text and raises ValueError if prompt injection is detected."""
        lower_text = text.lower()
        for kw in self.INJECTION_KEYWORDS:
            if kw in lower_text:
                raise ValueError(f"Security Alert: Model Armor blocked prompt injection attempt matching: '{kw}'")
        return text


class GeminiReasoningClient:
    """Mock client for Gemini LLM reasoning calls."""

    def __init__(self, model: str = "gemini-2.5-flash", safety_filter: ModelArmorFilter | None = None) -> None:
        self.model = model
        self.safety_filter = safety_filter or ModelArmorFilter()

    def build_prompt(self, context: Dict[str, Any], logs: str) -> str:
        """Constructs safe XML-delimited prompt for SRE reasoning."""
        return (
            "You are the DeployGuard Decision Assistant. Analyze the system state and determine if rollback is needed.\n\n"
            f"<system_state>\n"
            f"Service: {context.get('service_name')}\n"
            f"Environment: {context.get('environment')}\n"
            f"Anomaly Severity: {context.get('anomaly_severity')}\n"
            f"Affected Metrics: {context.get('affected_metrics')}\n"
            f"</system_state>\n\n"
            f"<untrusted_logs>\n"
            f"{logs}\n"
            f"</untrusted_logs>\n\n"
            "Response format MUST be JSON: {\"recommendation\": \"rollback|wait|alert\", \"confidence\": float, \"reasoning\": \"string\"}"
        )

    async def get_recommendation(self, context: Dict[str, Any], logs: str) -> Dict[str, Any]:
        """Validates inputs and calls LLM simulation to return structured decision dict."""
        # 1. Screen input prompt text
        prompt = self.build_prompt(context, logs)
        self.safety_filter.screen_text(prompt)

        # 2. Return simulated response based on inputs
        # Simulate rollback recommendation for HIGH/CRITICAL anomalies, wait/alert otherwise
        severity = context.get("anomaly_severity", "LOW")
        if severity in ["HIGH", "CRITICAL"]:
            recommendation = "rollback"
            confidence = 0.90
            reasoning = "Critical anomaly detected in system metrics; immediate rollback advised."
        else:
            recommendation = "wait"
            confidence = 0.85
            reasoning = "System telemetry indicates low severity; recommend wait-and-see approach."

        return {
            "recommendation": recommendation,
            "confidence": confidence,
            "reasoning": reasoning
        }

    def build_postmortem_prompt(self, incident_context: Dict[str, Any]) -> str:
        """Constructs XML-delimited prompt for postmortem narrative synthesis."""
        return (
            "You are the DeployGuard SRE Postmortem Specialist. Synthesize an executive summary, "
            "5-whys root cause analysis, and preventative recommendations from the incident data.\n\n"
            f"<incident_context>\n"
            f"Service: {incident_context.get('service_name')}\n"
            f"Severity: {incident_context.get('severity')}\n"
            f"Target Version: {incident_context.get('target_version')}\n"
            f"Stable Version: {incident_context.get('stable_version')}\n"
            f"Outcome: {incident_context.get('outcome')}\n"
            f"Anomalous Metrics: {incident_context.get('affected_metrics')}\n"
            f"Decision Rationale: {incident_context.get('decision_rationale')}\n"
            f"</incident_context>\n\n"
            "Response format MUST be JSON with keys: executive_summary (string), root_cause_analysis (string), preventative_actions (list of strings)."
        )

    async def generate_postmortem_narrative(self, incident_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generates executive summary, root cause, and action items with Model Armor screening."""
        prompt = self.build_postmortem_prompt(incident_context)
        self.safety_filter.screen_text(prompt)

        service = incident_context.get("service_name", "service")
        target_version = incident_context.get("target_version", "unknown")
        stable_version = incident_context.get("stable_version", "unknown")
        metrics = ", ".join(incident_context.get("affected_metrics", ["system metrics"]))
        outcome = incident_context.get("outcome", "resolved")

        executive_summary = (
            f"During deployment of {service} ({target_version}), automated monitoring detected a "
            f"{incident_context.get('severity', 'HIGH')} anomaly affecting {metrics}. The autonomous "
            f"governed decision engine evaluated policy rules and executed an authorized rollback to stable version "
            f"{stable_version}. Post-rollback verification confirmed system state was {outcome}."
        )

        root_cause_analysis = (
            f"1. Why did the incident occur? The deployment of {target_version} introduced abnormal spikes in {metrics}.\n"
            f"2. Why were metrics impacted? Resource allocation regressions or unhandled exceptions under traffic load.\n"
            f"3. Why was it not caught pre-deployment? Canary test suites did not simulate high-concurrency peak telemetry.\n"
            f"4. Why was blast radius minimized? DeployGuard detected anomaly within 30s and gated rollback execution.\n"
            f"5. Why was recovery successful? Fast automated rollback to verified stable release {stable_version} restored baseline performance."
        )

        preventative_actions = [
            f"Implement pre-deployment canary load tests specifically exercising {metrics}.",
            f"Add stricter static lint and performance benchmarking to {service} CI pipeline.",
            "Tune DeployGuard baseline anomaly detection thresholds for early warning alerts.",
            "Verify memory and CPU resource limits in Kubernetes / Cloud Run deployment manifests."
        ]

        return {
            "executive_summary": executive_summary,
            "root_cause_analysis": root_cause_analysis,
            "preventative_actions": preventative_actions,
        }
