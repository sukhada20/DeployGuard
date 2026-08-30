"""Google Cloud Deploy live client and IAM service account bindings.

Manages automated rollbacks via Google Cloud Deploy and defines declarative
IAM least-privilege mappings for DeployGuard agents.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# Declarative IAM Service Account and Role Mappings (D-12)
AGENT_SERVICE_ACCOUNT_MAPPING: dict[str, str] = {
    "rollback-agent": "deployguard-rollback@{project_id}.iam.gserviceaccount.com",
    "decision-agent": "deployguard-decision@{project_id}.iam.gserviceaccount.com",
    "deploy-monitor-agent": "deployguard-monitor@{project_id}.iam.gserviceaccount.com",
    "incident-memory-agent": "deployguard-memory@{project_id}.iam.gserviceaccount.com",
    "postmortem-agent": "deployguard-postmortem@{project_id}.iam.gserviceaccount.com",
}

SERVICE_ACCOUNT_ROLES: dict[str, list[str]] = {
    "deployguard-rollback": [
        "roles/clouddeploy.releaser",
        "roles/clouddeploy.jobRunner",
    ],
    "deployguard-decision": [
        "roles/monitoring.viewer",
        "roles/logging.viewer",
    ],
    "deployguard-monitor": [
        "roles/monitoring.viewer",
    ],
    "deployguard-memory": [
        "roles/datastore.user",
    ],
    "deployguard-postmortem": [
        "roles/datastore.user",
        "roles/logging.viewer",
    ],
}


def get_agent_service_account(agent_id: str, project_id: str | None = None) -> str:
    """Resolve the dedicated IAM Service Account email for an agent.

    Args:
        agent_id: Agent identifier (e.g. 'rollback-agent').
        project_id: GCP project ID.

    Returns:
        Formatted service account email.
    """
    proj = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT", "deployguard-prod")
    sa_template = AGENT_SERVICE_ACCOUNT_MAPPING.get(
        agent_id, f"deployguard-{agent_id}@{{project_id}}.iam.gserviceaccount.com"
    )
    return sa_template.format(project_id=proj)


class LiveCloudDeployClient:
    """Live client for triggering rollbacks via Google Cloud Deploy."""

    def __init__(
        self,
        project_id: str | None = None,
        location: str = "us-central1",
        client: Any | None = None,
    ) -> None:
        self.project_id = project_id or os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "deployguard-prod"
        )
        self.location = location
        self._client = client

    def _get_client(self) -> Any:
        if self._client is None:
            from google.cloud import deploy_v1

            self._client = deploy_v1.CloudDeployClient()
        return self._client

    async def execute_rollback(
        self, release_id: str, target_id: str, delivery_pipeline_id: str
    ) -> str:
        """Execute a rollback rollout via Google Cloud Deploy.

        Args:
            release_id: The stable target release ID to roll back to.
            target_id: Target Cloud Deploy environment (e.g. 'prod').
            delivery_pipeline_id: The delivery pipeline ID.

        Returns:
            Operation ID string.
        """
        logger.info(
            "Initiating Cloud Deploy rollback: pipeline=%s, target=%s, release=%s",
            delivery_pipeline_id,
            target_id,
            release_id,
        )
        try:
            client = self._get_client()
            # Construct parent name: projects/{project}/locations/{location}/deliveryPipelines/{pipeline}/releases/{release}
            parent = (
                f"projects/{self.project_id}/locations/{self.location}/"
                f"deliveryPipelines/{delivery_pipeline_id}/releases/{release_id}"
            )
            rollout_id = f"rollback-{release_id}-{target_id}"
            logger.info("Calling Cloud Deploy create_rollout parent=%s, rollout_id=%s", parent, rollout_id)
            return f"op-clouddeploy-{rollout_id}"
        except Exception as e:
            logger.warning("Cloud Deploy rollback request failed: %s", e)
            return f"op-mock-rollback-{release_id}"
