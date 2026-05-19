#!/usr/bin/env python3
"""Inspect a recent ElevenLabs phone call (why it dropped, number wiring)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.config import get_settings
from app.db.supabase_client import get_supabase
from app.services.work_context import fetch_junior_work_context

DEFAULT_JUNIOR = "11111111-1111-1111-1111-111111111111"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("conversation_id", nargs="?", help="e.g. conv_7901krznt3kqerev844mgf7hpmpf")
    parser.add_argument("--junior-id", default=DEFAULT_JUNIOR)
    args = parser.parse_args()

    settings = get_settings()
    if not settings.elevenlabs_api_key:
        print("ELEVENLABS_API_KEY not set")
        sys.exit(1)

    from elevenlabs import ElevenLabs

    client = ElevenLabs(api_key=settings.elevenlabs_api_key)

    # Phone number wired in .env
    print("=" * 60)
    print("ELEVENLABS PHONE NUMBER (from ELEVENLABS_AGENT_PHONE_NUMBER_ID)")
    print("=" * 60)
    try:
        pn = client.conversational_ai.phone_numbers.get(
            phone_number_id=settings.elevenlabs_agent_phone_number_id
        )
        d = pn.model_dump() if hasattr(pn, "model_dump") else dict(pn)
        from_number = d.get("phone_number", "?")
        agent = d.get("assigned_agent")
        print(f"  ID:     {settings.elevenlabs_agent_phone_number_id}")
        print(f"  Number: {from_number}")
        print(f"  Agent:  {agent or '(not assigned in UI — assign work-check-in agent)'}")
    except Exception as exc:
        print("  Could not load:", exc)
        from_number = "?"

    ctx, _ = fetch_junior_work_context(get_supabase(), args.junior_id)
    to_number = (ctx or {}).get("profile", {}).get("phone") or "(missing in profile)"
    print()
    print("JUNIOR DESTINATION (profiles.phone in Supabase)")
    print(f"  {to_number}")
    print()

    if from_number != "?" and to_number != "(missing in profile)":
        if from_number == to_number:
            print("!!! MISCONFIGURATION !!!")
            print("  FROM and TO are the SAME number.")
            print("  Outbound calls cannot ring your phone and connect the AI on the same line.")
            print()
            print("  FIX:")
            print("  1. ElevenLabs → Phone numbers → import your TWILIO number (+1… from Twilio console)")
            print("  2. Set ELEVENLABS_AGENT_PHONE_NUMBER_ID to that import (not your personal mobile)")
            print("  3. Keep Sam's phone (+316…) only in Supabase as the person being called")
            print()

    if not args.conversation_id:
        print("Pass a conversation_id from trigger_call.py to inspect that call, e.g.:")
        print("  python scripts/diagnose_call.py conv_7901krznt3kqerev844mgf7hpmpf")
        return

    print("=" * 60)
    print("CONVERSATION", args.conversation_id)
    print("=" * 60)
    try:
        c = client.conversational_ai.conversations.get(conversation_id=args.conversation_id)
        cd = c.model_dump() if hasattr(c, "model_dump") else dict(c)
    except Exception as exc:
        print("Failed to load conversation:", exc)
        sys.exit(1)

    meta = cd.get("metadata") or {}
    phone = meta.get("phone_call") or {}
    print(f"  status:     {cd.get('status')}")
    print(f"  duration:   {meta.get('call_duration_secs', 0)}s")
    print(f"  terminate:  {meta.get('termination_reason') or '(none)'}")
    print(f"  agent_num:  {phone.get('agent_number')}")
    print(f"  callee:     {phone.get('external_number')}")
    print(f"  call_sid:   {phone.get('call_sid')}")

    transcript = cd.get("transcript") or []
    if not transcript:
        print()
        print("  No transcript — AI likely never spoke (call died at Twilio trial bridge).")
    else:
        print()
        print("  Transcript:")
        for line in transcript[:8]:
            role = line.get("role", "?")
            msg = (line.get("message") or line.get("text") or "")[:120]
            print(f"    {role}: {msg}")

    print()
    print("Twilio trial tips: backend/docs/twilio-trial-playbook.md")


if __name__ == "__main__":
    main()
