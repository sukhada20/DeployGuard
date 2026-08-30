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
