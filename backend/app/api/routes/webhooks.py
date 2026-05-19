import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.services.webhook_handler import complete_check_in_from_transcription

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/elevenlabs")
async def elevenlabs_post_call(request: Request):
    """
    Receives ElevenLabs post-call transcription webhooks.

    Configure in ElevenLabs Agents → Settings → Webhooks.
    Point URL to: {PUBLIC_BASE_URL}/webhooks/elevenlabs
    """
    raw = await request.body()
    signature = request.headers.get("elevenlabs-signature")
    settings = get_settings()

    event: dict
    if settings.elevenlabs_webhook_secret:
        try:
            from elevenlabs import ElevenLabs

            client = ElevenLabs(api_key=settings.elevenlabs_api_key)
            event = client.webhooks.construct_event(
                raw_body=raw.decode("utf-8"),
                sig_header=signature,
                secret=settings.elevenlabs_webhook_secret,
            )
        except Exception as exc:
            logger.warning("Webhook signature verification failed: %s", exc)
            raise HTTPException(status_code=401, detail="Invalid webhook signature") from exc
    else:
        import json

        logger.warning("ELEVENLABS_WEBHOOK_SECRET not set — accepting unsigned payload (dev only)")
        event = json.loads(raw.decode("utf-8"))

    event_type = event.get("type")
    if event_type == "post_call_transcription":
        try:
            result = complete_check_in_from_transcription(event)
            return {"status": "received", **result}
        except Exception as exc:
            logger.exception("Failed to process transcription webhook")
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    if event_type == "call_initiation_failure":
        logger.error("Call initiation failed: %s", event.get("data"))
        return JSONResponse({"status": "logged"}, status_code=200)

    return {"status": "ignored", "type": event_type}
