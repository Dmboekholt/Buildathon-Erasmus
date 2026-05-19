from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load backend/.env before Settings is instantiated (uvicorn cwd = backend/)
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # ElevenLabs + Twilio (native integration)
    elevenlabs_api_key: str = ""
    elevenlabs_agent_id: str = ""
    elevenlabs_agent_phone_number_id: str = ""
    elevenlabs_webhook_secret: str = ""
    # demo = Hi Sam + first question; disables end_call (best for client demo)
    # dashboard = UI only (often hangs up after greeting on Nova templates)
    # full = demo + full task list in system prompt
    elevenlabs_prompt_mode: str = "demo"

    # Check-in behaviour
    check_in_interval_days: int = 14
    demo_mode: bool = True  # allows triggering calls without interval guard

    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    public_base_url: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
