"""Turn ElevenLabs post-call payloads into plain-text debrief transcripts."""

from __future__ import annotations

from typing import Any


def transcript_from_webhook_data(data: dict[str, Any]) -> str:
    turns = data.get("transcript") or []
    lines: list[str] = []
    for turn in turns:
        role = turn.get("role") or turn.get("speaker") or "unknown"
        message = (turn.get("message") or turn.get("text") or "").strip()
        if message:
            lines.append(f"{role}: {message}")
    if lines:
        return "\n".join(lines)

    analysis = data.get("analysis") or {}
    summary = (analysis.get("transcript_summary") or analysis.get("summary") or "").strip()
    if summary:
        return f"summary: {summary}"
    return ""


def extract_check_in_metadata(data: dict[str, Any]) -> dict[str, str | None]:
    initiation = data.get("conversation_initiation_client_data") or {}
    dynamic = initiation.get("dynamic_variables") or {}
    return {
        "junior_id": dynamic.get("junior_id") or initiation.get("user_id"),
        "check_in_id": dynamic.get("check_in_id"),
        "conversation_id": data.get("conversation_id"),
    }
