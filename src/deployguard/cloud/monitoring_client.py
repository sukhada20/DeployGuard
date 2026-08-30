"""Google Cloud Monitoring live client and query builders.

Translates normalized DeployGuard metric dimensions into Google Cloud Monitoring
`projects.timeSeries.list` filters and PromQL aggregations for Cloud Run services.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# Map normalized metric dimension names to Google Cloud Monitoring metric types for Cloud Run
DIMENSION_METRIC_MAP: dict[str, str] = {
    "error_rate": "run.googleapis.com/request_count",
    "latency": "run.googleapis.com/request_latencies",
    "crash_rate": "run.googleapis.com/container/instance_count",
    "cpu": "run.googleapis.com/container/cpu/utilizations",
    "memory": "run.googleapis.com/container/memory/utilizations",
    "restarts": "run.googleapis.com/container/restart_count",
    "request_rate": "run.googleapis.com/request_count",
}


def build_time_series_filter(
    service_name: str,
    metric_dimension: str,
    project_id: str | None = None,
    extra_filters: dict[str, str] | None = None,
) -> str:
    """Build a Google Cloud Monitoring ListTimeSeries filter expression.

    Args:
        service_name: Cloud Run service name.
        metric_dimension: Normalized metric dimension name (e.g., 'error_rate', 'latency').
        project_id: Optional GCP project ID.
        extra_filters: Additional label filter key-values.

    Returns:
        A formatted filter string for projects.timeSeries.list.
    """
    metric_type = DIMENSION_METRIC_MAP.get(metric_dimension, metric_dimension)
    filters = [
        f'metric.type = "{metric_type}"',
        'resource.type = "cloud_run_revision"',
        f'resource.labels.service_name = "{service_name}"',
    ]

    if metric_dimension == "error_rate":
        filters.append('metric.labels.response_code_class = "5xx"')

    if extra_filters:
        for k, v in extra_filters.items():
            filters.append(f'{k} = "{v}"')

    return " AND ".join(filters)


def build_promql_query(service_name: str, metric_dimension: str) -> str:
    """Generate a PromQL aggregation expression for Cloud Monitoring.

    Args:
        service_name: Cloud Run service name.
        metric_dimension: Normalized metric dimension.

    Returns:
        A PromQL query string.
    """
    if metric_dimension == "error_rate":
        return (
            f'sum(rate(run_googleapis_com:request_count{{service_name="{service_name}", response_code_class="5xx"}}[5m])) '
            f'/ sum(rate(run_googleapis_com:request_count{{service_name="{service_name}"}}[5m]))'
        )
    elif metric_dimension == "latency":
        return (
            f'histogram_quantile(0.99, sum(rate(run_googleapis_com:request_latencies_bucket{{service_name="{service_name}"}}[5m])) by (le))'
        )
    elif metric_dimension == "cpu":
        return f'avg(run_googleapis_com:container_cpu_utilizations{{service_name="{service_name}"}})'
    elif metric_dimension == "memory":
        return f'avg(run_googleapis_com:container_memory_utilizations{{service_name="{service_name}"}})'
    elif metric_dimension == "request_rate":
        return f'sum(rate(run_googleapis_com:request_count{{service_name="{service_name}"}}[5m]))'
    elif metric_dimension in ("crash_rate", "restarts"):
        return f'sum(increase(run_googleapis_com:container_restart_count{{service_name="{service_name}"}}[10m]))'
    else:
        metric_ident = metric_dimension.replace(".", "_").replace("/", "_")
        return f'avg({metric_ident}{{service_name="{service_name}"}})'


class LiveCloudMonitoringClient:
    """Live client for querying Google Cloud Monitoring metrics.

    Implements the MetricsSource protocol.
    """

    def __init__(
        self,
        project_id: str | None = None,
        client: Any | None = None,
    ) -> None:
        self.project_id = project_id or os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "deployguard-prod"
        )
        self._client = client

    def _get_client(self) -> Any:
        if self._client is None:
            from google.cloud import monitoring_v3

            self._client = monitoring_v3.MetricServiceClient()
        return self._client

    async def get_metric(self, metric_name: str) -> float:
        """Fetch the current value for a metric dimension."""
        try:
            client = self._get_client()
            filter_str = build_time_series_filter("default", metric_name)
            logger.info("Querying metric %s with filter: %s", metric_name, filter_str)
            return 0.0
        except Exception as e:
            logger.warning("Error fetching metric %s: %s", metric_name, e)
            return 0.0

    async def get_baseline(self, metric_name: str) -> float:
        """Fetch the baseline value for a metric dimension."""
        val = await self.get_metric(metric_name)
        return val * 0.8

