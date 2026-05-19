from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "elevenlabs_configured": bool(s.elevenlabs_api_key and s.elevenlabs_agent_id),
        "supabase_configured": bool(s.supabase_url and s.supabase_service_role_key),
        "demo_mode": s.demo_mode,
    }
