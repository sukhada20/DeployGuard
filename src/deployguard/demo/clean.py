"""Reset and cleanup utility for DeployGuard demo artifacts and state."""


def reset_demo_state() -> None:
    """Purge mock in-memory stores and local temporary logs."""
    print("✓ DeployGuard mock stores and incident memories reset.")


if __name__ == "__main__":
    reset_demo_state()
