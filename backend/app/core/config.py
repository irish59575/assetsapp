from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator
from typing import List, Union, Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # App
    APP_NAME: str = "AssetTracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database — defaults to local SQLite
    DATABASE_URL: str = "sqlite:///./assets.db"

    # Supabase (optional, kept for compatibility)
    SUPABASE_URL: str = "http://localhost"
    SUPABASE_KEY: str = "local-dev-key"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # JWT
    SECRET_KEY: str = "change-this-to-a-long-random-string-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:3000"

    # LabTech / ConnectWise Automate MySQL connection
    LABTECH_HOST: str = ""
    LABTECH_PORT: int = 3306
    LABTECH_USER: str = ""
    LABTECH_PASSWORD: str = ""
    LABTECH_DB: str = "labtech"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
