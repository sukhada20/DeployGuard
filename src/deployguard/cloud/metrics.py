import math
from typing import Any

METRIC_THRESHOLDS = {
    "error_rate": 1.5,  # 50% increase
    "latency": 1.5,  # 50% increase
    "crash_rate": 1.2,  # 20% increase
    "cpu": 1.3,  # 30% increase
    "memory": 1.3,  # 30% increase
    "restarts": 1.0,  # any increase
    "request_rate": 2.0,  # 100% increase
}


def compare_metrics(
    current: dict[str, float], baselines: dict[str, float]
) -> list[dict[str, Any]]:
    """Compare current metrics to baselines and return evidence of anomalies.

    Returns a list of dicts with: {metric, baseline, current, ratio, anomalous}
    """
    evidence = []
    for metric, threshold in METRIC_THRESHOLDS.items():
        curr_val = current.get(metric, 0.0)
        base_val = baselines.get(metric, 0.0)

        # Guard against zero-division
        if math.isclose(base_val, 0.0):
            ratio = 1.0 if math.isclose(curr_val, 0.0) else float("inf")
        else:
            ratio = round(curr_val / base_val, 4)

        anomalous = ratio > threshold if not math.isinf(ratio) else curr_val > 0.0

        evidence.append(
            {
                "metric": metric,
                "baseline": base_val,
                "current": curr_val,
                "ratio": ratio,
                "anomalous": anomalous,
            }
        )
    return evidence
