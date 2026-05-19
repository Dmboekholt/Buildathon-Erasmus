import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import check_ins, health, webhooks
from app.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="Judgment Ledger — Work Check-in API",
    description="Bi-weekly voice check-ins for junior analysts (ElevenLabs + Twilio)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(check_ins.router)
app.include_router(webhooks.router)


@app.get("/")
def root():
    settings = get_settings()
    return {
        "service": "judgment-ledger-check-ins",
        "docs": "/docs",
        "trigger_demo": f"POST /check-ins/trigger/{'{{junior_id}}'}?force=true",
        "due_juniors": "GET /check-ins/due",
    }
