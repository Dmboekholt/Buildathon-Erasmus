from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.db.supabase_client import get_supabase
from app.services.scheduler import list_due_juniors, run_check_in_for_junior, run_due_check_ins
from app.services.work_context import fetch_junior_work_context

router = APIRouter(prefix="/check-ins", tags=["check-ins"])


@router.get("/due")
def get_due_juniors():
    """Juniors who are due for a bi-weekly work check-in."""
    settings = get_settings()
    return {"due": list_due_juniors(settings), "interval_days": settings.check_in_interval_days}


@router.get("/{junior_id}/context")
def get_junior_context(junior_id: str):
    """Preview what the voice agent will know about this junior's current work."""
    supabase = get_supabase()
    work_context, variables = fetch_junior_work_context(supabase, junior_id)
    if not work_context:
        raise HTTPException(status_code=404, detail="Junior not found")
    return {
        "junior_id": junior_id,
        "profile": work_context["profile"],
        "tasks": work_context["tasks"],
        "dynamic_variables": variables,
    }


@router.post("/trigger/{junior_id}")
def trigger_check_in(junior_id: str, force: bool = Query(False)):
    """
    Start an outbound phone check-in for one junior (demo-friendly).

    Requires ElevenLabs Twilio number + agent configured.
    """
    settings = get_settings()
    try:
        result = run_check_in_for_junior(settings, junior_id, force=force or settings.demo_mode)
        return {"ok": True, **result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/run-due")
def run_all_due():
    """Call every junior who is due (use with cron every day or so)."""
    settings = get_settings()
    results = run_due_check_ins(settings)
    return {"ok": True, "results": results, "count": len(results)}
