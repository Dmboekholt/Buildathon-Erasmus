#!/usr/bin/env python3
"""
Place a work check-in phone call for a junior.

The script returns as soon as Twilio accepts the call — the conversation
continues on your phone for several minutes. Answer when it rings.

Usage:
  cd backend && source .venv/bin/activate
  python scripts/trigger_call.py
  python scripts/trigger_call.py --junior-id 11111111-1111-1111-1111-111111111111
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.config import get_settings
from app.db.supabase_client import get_supabase
from app.services.scheduler import run_check_in_for_junior
from app.services.work_context import fetch_junior_work_context

DEFAULT_JUNIOR = "11111111-1111-1111-1111-111111111111"


def print_twilio_trial_playbook(*, conversation_id: str | None = None) -> None:
    """Best-effort instructions when using Twilio trial (no upgrade)."""
    print("=" * 60)
    print("TWILIO TRIAL — follow this every time (no upgrade needed)")
    print("=" * 60)
    print(
        'You WILL hear: "trial account… press any key to execute your code."\n'
        "That is Twilio, not our app. The script already succeeded above.\n"
    )
    print("  1. Answer quickly.")
    print("  2. Press ONE keypad digit (try 5 or * if 1 hangs up) as soon as you hear that sentence.")
    print("  3. Do NOT hang up — count to 10 in silence (bridge can take 10–15 sec).")
    print('  4. Wait for "Hi Sam…" then say: "Hi, yes — go ahead."')
    print("  5. Use the phone keypad, not CarPlay/Bluetooth, if the call drops.")
    print()
    print("Twilio Console → Verified Caller IDs — your number must be listed.")
    print("Full playbook: backend/docs/twilio-trial-playbook.md")
    if conversation_id:
        print(f"Debug: https://elevenlabs.io/app/agents/history (search {conversation_id})")
    print("=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(description="Trigger work check-in phone call")
    parser.add_argument("--junior-id", default=DEFAULT_JUNIOR)
    args = parser.parse_args()

    get_settings.cache_clear()
    get_supabase.cache_clear()

    sb = get_supabase()
    ctx, variables = fetch_junior_work_context(sb, args.junior_id)
    if not ctx:
        print("Junior not found:", args.junior_id)
        sys.exit(1)

    phone = ctx["profile"].get("phone")
    print("=" * 60)
    print("WORK CHECK-IN — phone call")
    print("=" * 60)
    print(f"Junior:  {ctx['profile'].get('full_name')} ({args.junior_id})")
    print(f"Phone:   {phone}")
    print(f"Tasks:   {len(ctx.get('tasks') or [])} open assignment(s)")
    print()
    print("Questions the agent will probe:")
    print(variables.get("check_in_questions", ""))
    print()
    print("Placing call… (this script exits; the call continues on your phone)")
    print()
    print_twilio_trial_playbook()
    print("Dialing now — have your phone ready.")
    print("=" * 60)

    settings = get_settings()
    from app.services.agent_prompt import build_opening_message

    print(f"Prompt mode: {settings.elevenlabs_prompt_mode}")
    print("Opening line sent to ElevenLabs:")
    print(" ", build_opening_message(variables.get("junior_name", "Analyst")))
    try:
        result = run_check_in_for_junior(settings, args.junior_id, force=True)
    except Exception as exc:
        print("FAILED:", exc)
        sys.exit(1)

    print("SUCCESS — answer your phone now.")
    for key in ("conversation_id", "call_sid", "message"):
        if result.get(key):
            print(f"  {key}: {result[key]}")
    print()
    print_twilio_trial_playbook(conversation_id=result.get("conversation_id"))
    print("Expect a 5–10 minute check-in once you hear Hi Sam.")


if __name__ == "__main__":
    main()
