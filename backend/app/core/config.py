# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # Explicitly load the .env file located in the backend directory,
    # regardless of the current working directory. Ignore any extra env keys.
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding='utf-8',
        extra='ignore',
    )

    # Define the environment variables your app needs.
    # Pydantic will automatically read them and validate their types.
    GOOGLE_API_KEY: str

# Create a single, reusable instance of the settings
settings = Settings()