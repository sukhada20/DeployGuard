"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """DeployGuard runtime configuration.

    All fields can be overridden via environment variables or .env file.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application
    app_name: str = "DeployGuard"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"  # development | staging | production

    # Google Cloud (stub values safe for local dev)
    google_project_id: str = "deployguard-local"
    google_api_key: str = "stub"

    # Agent Gateway
    gateway_enabled: bool = True
    gateway_strict_mode: bool = False  # False in dev, True in production


def get_settings() -> Settings:
    """Return application settings."""
    return Settings()
