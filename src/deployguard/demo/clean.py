"""Reset and cleanup utility for DeployGuard demo artifacts and state."""

import os
import shutil
from deployguard.cloud.stubs import MockFirestore, MockMonitoring, MockLogging, MockCloudDeploy

def reset_demo_state() -> None:
    """Purge mock in-memory stores and local temporary logs."""
    MockFirestore.clear()
    MockMonitoring.clear()
    MockLogging.clear()
    MockCloudDeploy.clear()
    print("✓ DeployGuard mock stores and incident memories reset.")

if __name__ == "__main__":
    reset_demo_state()
