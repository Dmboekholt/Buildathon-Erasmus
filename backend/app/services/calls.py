"""Place outbound check-in calls via ElevenLabs native Twilio integration."""

from __future__ import annotations

import logging
from typing import Any

from elevenlabs import ElevenLabs
from elevenlabs.types.conversation_initiation_client_data_request_input import (
    ConversationInitiationClientDataRequestInput,
)
from elevenlabs.types.telephony_call_config import TelephonyCallConfig

from app.config import Settings
from app.services.agent_prompt import build_initiation_payload

logger = logging.getLogger(__name__)


def normalize_e164(phone: str) -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    if not cleaned.startswith("+"):
        raise ValueError(f"Phone must be E.164 (start with +): {phone}")
    return cleaned


def place_check_in_call(
    settings: Settings,
    *,
    junior_id: str,
    to_phone: str,
    dynamic_variables: dict[str, str],
    check_in_id: str,
) -> dict[str, Any]:
    if not settings.elevenlabs_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is not set")
    if not settings.elevenlabs_agent_id:
        raise RuntimeError("ELEVENLABS_AGENT_ID is not set")
    if not settings.elevenlabs_agent_phone_number_id:
        raise RuntimeError("ELEVENLABS_AGENT_PHONE_NUMBER_ID is not set")

    client = ElevenLabs(api_key=settings.elevenlabs_api_key)
    to_number = normalize_e164(to_phone)

    initiation_data = build_initiation_payload(
        junior_id=junior_id,
        check_in_id=check_in_id,
        variables=dynamic_variables,
        mode=settings.elevenlabs_prompt_mode,
    )
    from app.services.agent_prompt import build_opening_message

    opening = build_opening_message(dynamic_variables.get("junior_name", "Analyst"))
    logger.info(
        "Outbound call prompt_mode=%s opening=%s",
        settings.elevenlabs_prompt_mode,
        opening[:80],
    )
    initiation = ConversationInitiationClientDataRequestInput(**initiation_data)

    try:
        response = client.conversational_ai.twilio.outbound_call(
            agent_id=settings.elevenlabs_agent_id,
            agent_phone_number_id=settings.elevenlabs_agent_phone_number_id,
            to_number=to_number,
            conversation_initiation_client_data=initiation,
            call_recording_enabled=True,
            telephony_call_config=TelephonyCallConfig(ringing_timeout_secs=90),
        )
    except Exception as exc:
        msg = str(exc)
        if "401" in msg or "unauthorized" in msg.lower():
            raise RuntimeError(
                "ElevenLabs rejected the API key (401). Regenerate the key with "
                "Conversational AI / Agents access and update ELEVENLABS_API_KEY."
            ) from exc
        raise

    payload = response.model_dump() if hasattr(response, "model_dump") else dict(response)
    logger.info("Outbound call placed check_in=%s conversation_id=%s", check_in_id, payload.get("conversation_id"))
    return payload
