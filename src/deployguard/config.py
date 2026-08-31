"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """DeployGuard runtime configuration.

    All fields can be overridden via environment variables or .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "DeployGuard"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"  # development | staging | production
    port: int = 8080

    # Google Cloud
    google_cloud_project: str = "deployguard-507111"
    google_cloud_location: str = "us-central1"
    google_project_id: str = "deployguard-507111"
    google_api_key: str = "stub"
    deployguard_mock_gcp: bool = False
    use_live_gcp: bool = True

    # Agent Gateway & Security
    gateway_enabled: bool = True
    gateway_strict_mode: bool = False  # False in dev, True in production

    # Reasoning & Thresholds
    gemini_model: str = "gemini-3.5-flash"
    min_confidence_threshold_prod: float = 0.85
    min_confidence_threshold_stage: float = 0.70
    max_deployment_age_seconds: int = 1800

    # Observability
    otel_service_name: str = "deployguard-fleet"


def get_settings() -> Settings:
    """Return application settings."""
    return Settings()
