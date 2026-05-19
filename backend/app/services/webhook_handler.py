"""Persist post-call transcripts from ElevenLabs webhooks."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.db.errors import is_missing_column, is_missing_table
from app.db.supabase_client import get_supabase
from app.services.transcript import extract_check_in_metadata, transcript_from_webhook_data

logger = logging.getLogger(__name__)


def complete_check_in_from_transcription(event: dict[str, Any]) -> dict[str, Any]:
    data = event.get("data") or {}
    meta = extract_check_in_metadata(data)
    junior_id = meta.get("junior_id")
    check_in_id = meta.get("check_in_id")
    conversation_id = meta.get("conversation_id")

    transcript = transcript_from_webhook_data(data)
    if not transcript:
        logger.warning("Empty transcript for conversation %s", conversation_id)
        transcript = "(no transcript captured)"

    supabase = get_supabase()
    primary_task_id = None
    if check_in_id:
        try:
            ci = (
                supabase.table("check_ins")
                .select("primary_task_id, junior_id")
                .eq("id", check_in_id)
                .maybe_single()
                .execute()
            )
            if ci.data:
                primary_task_id = ci.data.get("primary_task_id")
                junior_id = junior_id or ci.data.get("junior_id")
        except Exception as exc:
            if not is_missing_table(exc, "check_ins"):
                raise

    debrief_row: dict[str, Any] = {
        "junior_id": junior_id,
        "task_id": primary_task_id,
        "transcript": transcript,
        "status": "pending",
        "kind": "work_check_in",
        "elevenlabs_conversation_id": conversation_id,
        "questions_json": {
            "source": "work_check_in",
            "check_in_id": check_in_id,
        },
    }
    try:
        debrief_res = supabase.table("debriefs").insert(debrief_row).select("id").single().execute()
    except Exception as exc:
        if is_missing_column(exc, "kind"):
            debrief_row.pop("kind", None)
            debrief_res = supabase.table("debriefs").insert(debrief_row).select("id").single().execute()
        else:
            raise
    debrief_id = debrief_res.data["id"]

    now = datetime.now(timezone.utc).isoformat()
    if check_in_id:
        try:
            supabase.table("check_ins").update(
                {
                    "status": "completed",
                    "completed_at": now,
                    "debrief_id": debrief_id,
                    "elevenlabs_conversation_id": conversation_id,
                }
            ).eq("id", check_in_id).execute()
        except Exception as exc:
            if not is_missing_table(exc, "check_ins"):
                raise

    if junior_id:
        try:
            supabase.table("profiles").update({"last_check_in_at": now}).eq("id", junior_id).execute()
        except Exception as exc:
            if not is_missing_column(exc, "last_check_in_at"):
                raise

    logger.info(
        "Saved work check-in debrief debrief_id=%s junior_id=%s check_in_id=%s",
        debrief_id,
        junior_id,
        check_in_id,
    )

    return {
        "debrief_id": debrief_id,
        "junior_id": junior_id,
        "check_in_id": check_in_id,
        "conversation_id": conversation_id,
        "transcript_length": len(transcript),
    }
