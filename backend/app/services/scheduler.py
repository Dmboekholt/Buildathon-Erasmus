"""Schedule and run bi-weekly work check-ins for junior analysts."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import Settings
from postgrest.exceptions import APIError

from app.db.errors import is_missing_table
from app.db.supabase_client import get_supabase
from app.services.calls import place_check_in_call
from app.services.work_context import fetch_junior_work_context

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def junior_is_due(profile: dict[str, Any], settings: Settings) -> bool:
    if settings.demo_mode:
        return True

    interval = profile.get("check_in_interval_days") or settings.check_in_interval_days
    last = profile.get("last_check_in_at")
    if not last:
        return True

    if isinstance(last, str):
        last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
    else:
        last_dt = last

    return _utcnow() - last_dt >= timedelta(days=int(interval))


def list_due_juniors(settings: Settings) -> list[dict[str, Any]]:
    supabase = get_supabase()
    try:
        res = (
            supabase.table("profiles")
            .select("id, full_name, phone, role, check_in_interval_days, last_check_in_at")
            .eq("role", "junior")
            .execute()
        )
    except Exception:
        res = (
            supabase.table("profiles")
            .select("id, full_name, phone, role")
            .eq("role", "junior")
            .execute()
        )
    due = []
    for row in res.data or []:
        if not row.get("phone"):
            continue
        if junior_is_due(row, settings):
            due.append(row)
    return due


def _has_active_check_in(supabase, junior_id: str) -> bool:
    try:
        res = (
            supabase.table("check_ins")
            .select("id")
            .eq("junior_id", junior_id)
            .in_("status", ["scheduled", "calling"])
            .limit(1)
            .execute()
        )
        return bool(res.data)
    except APIError as exc:
        if is_missing_table(exc, "check_ins"):
            return False
        raise
    except Exception as exc:
        if is_missing_table(exc, "check_ins"):
            return False
        raise


def create_check_in_record(
    supabase,
    *,
    junior_id: str,
    primary_task_id: str | None,
    work_context: dict[str, Any],
) -> str:
    row = {
        "junior_id": junior_id,
        "primary_task_id": primary_task_id,
        "status": "scheduled",
        "scheduled_for": _utcnow().isoformat(),
        "work_context": work_context,
    }
    try:
        res = supabase.table("check_ins").insert(row).execute()
        return res.data[0]["id"]
    except Exception as exc:
        if is_missing_table(exc, "check_ins"):
            fallback = str(uuid.uuid4())
            logger.warning(
                "check_ins table missing — using ephemeral id %s. "
                "Run backend/scripts/APPLY_IN_SUPABASE_SQL_EDITOR.sql in Supabase.",
                fallback,
            )
            return fallback
        raise


def _update_check_in(supabase, check_in_id: str, payload: dict[str, Any]) -> None:
    try:
        supabase.table("check_ins").update(payload).eq("id", check_in_id).execute()
    except Exception as exc:
        if is_missing_table(exc, "check_ins"):
            return
        raise


def run_check_in_for_junior(
    settings: Settings,
    junior_id: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    supabase = get_supabase()

    work_context, variables = fetch_junior_work_context(supabase, junior_id)
    if not work_context:
        raise ValueError(f"Junior not found: {junior_id}")

    profile = work_context["profile"]
    if not force and not junior_is_due(profile, settings):
        raise ValueError("Junior is not due for a check-in yet (set DEMO_MODE=true or use force=true)")

    if _has_active_check_in(supabase, junior_id):
        raise ValueError("Junior already has a scheduled or in-progress check-in")

    phone = settings.review_phone_to_number.strip() or profile.get("phone")
    if not phone:
        raise ValueError(
            "No destination phone: set REVIEW_PHONE_TO_NUMBER or profiles.phone"
        )

    check_in_id = create_check_in_record(
        supabase,
        junior_id=junior_id,
        primary_task_id=work_context.get("primary_task_id"),
        work_context={
            "tasks": work_context.get("tasks"),
            "dynamic_variables": variables,
        },
    )

    try:
        _update_check_in(
            supabase,
            check_in_id,
            {"status": "calling", "called_at": _utcnow().isoformat()},
        )

        call_result = place_check_in_call(
            settings,
            junior_id=junior_id,
            to_phone=phone,
            dynamic_variables=variables,
            check_in_id=check_in_id,
        )

        update = {
            "elevenlabs_conversation_id": call_result.get("conversation_id"),
            "twilio_call_sid": call_result.get("callSid") or call_result.get("call_sid"),
        }
        if not call_result.get("success", True):
            update["status"] = "failed"
            update["failure_reason"] = call_result.get("message", "Outbound call failed")
        _update_check_in(supabase, check_in_id, update)

        if update.get("status") == "failed":
            raise RuntimeError(update["failure_reason"])

        return {
            "check_in_id": check_in_id,
            "junior_id": junior_id,
            "junior_name": profile.get("full_name"),
            "phone": phone,
            "conversation_id": call_result.get("conversation_id"),
            "call_sid": update.get("twilio_call_sid"),
            "message": call_result.get("message", "Call initiated"),
        }
    except Exception as exc:
        _update_check_in(
            supabase,
            check_in_id,
            {"status": "failed", "failure_reason": str(exc)[:500]},
        )
        raise


def run_due_check_ins(settings: Settings) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for junior in list_due_juniors(settings):
        try:
            results.append(run_check_in_for_junior(settings, junior["id"]))
        except Exception as exc:
            logger.exception("Check-in failed for %s", junior["id"])
            results.append(
                {
                    "junior_id": junior["id"],
                    "junior_name": junior.get("full_name"),
                    "error": str(exc),
                }
            )
    return results
