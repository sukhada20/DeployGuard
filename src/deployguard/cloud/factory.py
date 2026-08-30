"""Cloud client factory with automatic mock fallback and ADC discovery.

Resolves live GCP connectors when `DEPLOYGUARD_MOCK_GCP=false` and valid credentials
are available via Application Default Credentials (ADC), otherwise falls back to
mock stubs with clear logging.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from deployguard.cloud.deploy_client import LiveCloudDeployClient
from deployguard.cloud.firestore_client import LiveFirestoreStore
from deployguard.cloud.logging_client import LiveCloudLoggingClient
from deployguard.cloud.monitoring_client import LiveCloudMonitoringClient
from deployguard.cloud.stubs import (
    MockCloudDeploy,
    MockFirestore,
    MockLogging,
    MockMonitoring,
)

logger = logging.getLogger(__name__)


def is_mock_mode() -> bool:
    """Check if DeployGuard is explicitly running in mock GCP mode."""
    return os.environ.get("DEPLOYGUARD_MOCK_GCP", "true").lower() in (
        "true",
        "1",
        "yes",
    )


def has_valid_adc() -> bool:
    """Check if Application Default Credentials (ADC) are valid and discoverable."""
    if is_mock_mode():
        return False
    try:
        import google.auth

        credentials, project = google.auth.default()
        return credentials is not None
    except Exception as e:
        logger.debug("ADC discovery failed: %s", e)
        return False


def get_monitoring_client() -> Any:
    """Get a Monitoring client instance (live or mock)."""
    if is_mock_mode() or not has_valid_adc():
        logger.info("Using MockMonitoring client (DEPLOYGUARD_MOCK_GCP=true or no ADC)")
        return MockMonitoring()
    try:
        return LiveCloudMonitoringClient()
    except Exception as e:
        logger.warning(
            "Failed initializing LiveCloudMonitoringClient, falling back to stub: %s", e
        )
        return MockMonitoring()


def get_logging_client() -> Any:
    """Get a Logging client instance (live or mock)."""
    if is_mock_mode() or not has_valid_adc():
        logger.info("Using MockLogging client (DEPLOYGUARD_MOCK_GCP=true or no ADC)")
        return MockLogging()
    try:
        return LiveCloudLoggingClient()
    except Exception as e:
        logger.warning(
            "Failed initializing LiveCloudLoggingClient, falling back to stub: %s", e
        )
        return MockLogging()


def get_deploy_client() -> Any:
    """Get a Cloud Deploy client instance (live or mock)."""
    if is_mock_mode() or not has_valid_adc():
        logger.info(
            "Using MockCloudDeploy client (DEPLOYGUARD_MOCK_GCP=true or no ADC)"
        )
        return MockCloudDeploy()
    try:
        return LiveCloudDeployClient()
    except Exception as e:
        logger.warning(
            "Failed initializing LiveCloudDeployClient, falling back to stub: %s", e
        )
        return MockCloudDeploy()


def get_document_store() -> Any:
    """Get a Firestore / DocumentStore client instance (live or mock)."""
    if is_mock_mode() or not has_valid_adc():
        logger.info(
            "Using MockFirestore document store (DEPLOYGUARD_MOCK_GCP=true or no ADC)"
        )
        return MockFirestore()
    try:
        return LiveFirestoreStore()
    except Exception as e:
        logger.warning(
            "Failed initializing Live Firestore client, falling back to stub: %s", e
        )
        return MockFirestore()
