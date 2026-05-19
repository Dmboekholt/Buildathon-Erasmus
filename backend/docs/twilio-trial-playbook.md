# Twilio trial — best demo without upgrading

You **cannot** remove Twilio’s trial message in code. You **can** make the demo reliable with this playbook.

## Before every test

0. **Two different numbers (critical)** — In ElevenLabs you must import your **Twilio** number (usually `+1…` from [Twilio Console → Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming)). That is who **calls**. Sam’s mobile (`+316…`) in Supabase is who **receives** the call. If both are the same number, the call **always dies** when you press a key. Check with:
   ```bash
   python scripts/diagnose_call.py
   ```
1. **Verified number** — [Twilio Console → Verified Caller IDs](https://www.twilio.com/console/phone-numbers/verified). Your mobile (`+31684070115`) must be listed. Trial accounts **only** call verified numbers reliably.
2. **Twilio trial country** — Trial voice only calls numbers in your **signup country**. If you signed up with a US number, a Dutch `+316` callee may fail after the trial prompt even if verified. Use a verified number in your signup country, or sign up / verify in the Netherlands.
3. **`backend/.env`** — `ELEVENLABS_PROMPT_MODE=demo` (default).
4. **ElevenLabs agent** — In **Work check-in** agent → **Tools**, remove or restrict **`end_call`** and **`submit_research_notes`** if present.
5. **Rehearse once** — Run `python scripts/trigger_call.py` and complete one full call alone before the client.

## On the phone (trial script)

| Step | Do this |
|------|--------|
| 1 | Run the script **before** you pick up — read the opening line in the terminal. |
| 2 | When the phone rings, **answer within 3 rings**. |
| 3 | You hear: *“You have a trial account. Press any key to execute your code.”* |
| 4 | **Immediately** press **one** key on the **phone keypad** — try **`5`** or **`*`** if **`1`** ends the call (some carriers treat `1` badly). Use the physical keypad, not CarPlay. |
| 5 | **Do not hang up.** Count slowly to **10** in silence (10–15 seconds). The AI bridge can take a moment. |
| 6 | When you hear *“Hi Sam…”*, reply out loud: **“Hi, yes — go ahead.”** |
| 7 | Answer the work questions; stay on until the agent wraps up (5–10 min). |

### If the call drops right after you press 5 (or any key)

Your ElevenLabs wiring can be correct and this still happens. Common causes:

1. **US Twilio → Netherlands mobile** — Trial accounts often fail to complete **international outbound** after the trial prompt, even when `+316…` is verified. The call ends instead of bridging to the AI.
2. **Geo Permissions** — In [Twilio Console → Voice → Geo permissions](https://console.twilio.com/us1/develop/voice/settings/geo-permissions), enable **Netherlands** (low-risk). Retry outbound once.
3. **Silent bridge** — Less likely if it ends *instantly* on keypress; if it rings 10+ sec then dies, you hung up during silence.

**Workaround without upgrading: call IN (recommended on trial)**

Outbound: `+1` calls your `+316` (often breaks on trial).  
**Inbound:** you dial **`+1 814 992 6274`** from your verified `+316` phone.

1. On your phone, call **`+1 814 992 6274`** (the Twilio number with **Judgment Ledger — Work check-in** assigned).
2. You may still hear the trial line once — press a key if asked.
3. The ElevenLabs agent should pick up (no US→NL outbound leg).

Ensure inbound is enabled on that number in ElevenLabs (same agent as outbound).

### If the call drops after you pressed a key (other tips)

- You pressed **too late** — press as soon as the trial sentence starts.
- Bluetooth / CarPlay delayed the DTMF — use the **handset keypad** or disable car audio for the demo.
- Number not verified — add it in Twilio and wait for verification SMS.

## What to tell the client (15 seconds)

> “Twilio’s free tier plays a one-line ‘press any key’ message — that’s their billing safety, not our product. Press any key, wait a few seconds, then you’ll hear the Judgment Ledger manager check-in with Sam’s name and real assignment questions.”

## Backup demo (no phone)

If the trial line fails in the room, show judgment training in the **browser** (same product story, no Twilio):

```bash
npm run dev
```

Open **Cases → Thermanova → Start review session** — in-browser voice debrief with ElevenLabs (different agent ID in root `.env`).

## Check what actually happened

- Terminal: `conversation_id` after `SUCCESS`
- [ElevenLabs call history](https://elevenlabs.io/app/agents/history) — search that ID  
  - **&lt; 15 s** → Twilio bridge / you hung up early  
  - **Agent spoke then ended** → tune agent tools / keep `demo` mode
