# Work check-in service (Python)

Outbound **phone** check-ins for junior analysts every ~2 weeks, using **ElevenLabs + Twilio native integration**. After each call, a post-call webhook saves the transcript to Supabase as a `work_check_in` debrief.

## What it does

1. Loads the junior's **open tasks** from Supabase.
2. Calls their phone via `POST /v1/convai/twilio/outbound-call` with dynamic variables (name, tasks, probe questions).
3. ElevenLabs agent asks: *What is your work product? What have you been up to? Real insights and decisions?*
4. On hang-up, ElevenLabs sends `post_call_transcription` → `POST /webhooks/elevenlabs` → row in `debriefs` + `check_ins` completed.

Later you can score debriefs with your existing Gemini flow or `app/services/scoring.py`.

## Prompt modes (`ELEVENLABS_PROMPT_MODE`)

| Mode | Use when |
|------|----------|
| `demo` (default) | **Hi Sam** on the phone — opener only; keeps ElevenLabs agent tools |
| `full` | Longer check-in with full task list in prompt (no `tool_ids: []` — that removes the name) |
| `dashboard` | Same as `demo` |

## API key permissions

The ElevenLabs key must include **Conversational AI** permissions (e.g. `convai_read`).  
If outbound calls return `401 missing_permissions`, create a new key in ElevenLabs with Agents / ConvAI access enabled.

## Prerequisites

1. **Twilio** account ([twilio.com](https://www.twilio.com)).
2. **ElevenLabs** account with **Agents** and **Twilio phone number** imported:
   - [Phone numbers](https://elevenlabs.io/app/agents/phone-numbers) → Import Twilio number (SID + Auth Token).
   - Create an agent for **work check-ins** (prompt: `backend/docs/elevenlabs-agent-prompt.md`).
   - Assign the number to that agent (inbound optional; outbound required).
3. **Supabase** with migrations applied. If `check_ins` is missing, run `backend/scripts/APPLY_IN_SUPABASE_SQL_EDITOR.sql` in the Supabase SQL editor. Until then, calls still work with an ephemeral check-in id.
4. **Hackathon DB fallback:** you can set `SUPABASE_SERVICE_ROLE_KEY` to your **publishable (anon)** key if demo RLS is open (Lovable default).
5. Junior `profiles.phone` in **E.164** format (e.g. `+31612345678`). Demo seed: Sam Patel `+447000000000` — replace with a real number for your demo.

## Environment

Copy `backend/.env.example` to `backend/.env` (or use repo root `.env`):

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=          # work-check-in agent
ELEVENLABS_AGENT_PHONE_NUMBER_ID=  # from ElevenLabs phone numbers UI
ELEVENLABS_WEBHOOK_SECRET=    # from ElevenLabs webhook settings
PUBLIC_BASE_URL=https://xxxx.ngrok-free.app  # for webhooks in dev
DEMO_MODE=true                # allow calls without 14-day wait
```

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Expose webhooks (required for transcripts):

```bash
ngrok http 8000
```

In **ElevenLabs → Agents → Settings → Webhooks**, add:

- URL: `{PUBLIC_BASE_URL}/webhooks/elevenlabs`
- Enable **Post-call transcription**
- Copy the signing secret → `ELEVENLABS_WEBHOOK_SECRET`

## Demo: call Sam Patel

```bash
# Preview context
curl http://localhost:8000/check-ins/11111111-1111-1111-1111-111111111111/context

# Place outbound call (update phone in Supabase first!)
curl -X POST "http://localhost:8000/check-ins/trigger/11111111-1111-1111-1111-111111111111?force=true"
```

Answer your phone. When the call ends, check `debriefs` where `kind = 'work_check_in'`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Config status |
| GET | `/check-ins/due` | Juniors due for check-in |
| GET | `/check-ins/{junior_id}/context` | Task summary for agent |
| POST | `/check-ins/trigger/{junior_id}` | Start one outbound call |
| POST | `/check-ins/run-due` | Call all due juniors |
| POST | `/webhooks/elevenlabs` | Post-call transcript |

Interactive docs: `http://localhost:8000/docs`

## Bi-weekly schedule (cron)

```bash
# Daily at 09:00 — only calls juniors past their interval
0 9 * * * cd /path/to/Buildathon-Erasmus/backend && .venv/bin/python scripts/run_scheduler.py
```

Set `DEMO_MODE=false` in production so the 14-day rule applies (`profiles.check_in_interval_days` or `CHECK_IN_INTERVAL_DAYS`).

## Architecture

```
┌─────────────┐     outbound      ┌──────────────┐     PSTN      ┌────────┐
│ Python API  │ ───────────────► │ ElevenLabs   │ ────────────► │ Junior │
│ (FastAPI)   │                  │ + Twilio     │               │ phone  │
└──────┬──────┘                  └──────┬───────┘               └────────┘
       │                                │
       │ Supabase                       │ post_call_transcription
       ▼                                ▼
┌─────────────┐                  ┌──────────────┐
│ tasks       │ ◄── context    │ /webhooks/   │
│ check_ins   │                  │ elevenlabs   │
│ debriefs    │ ◄── transcript └──────────────┘
└─────────────┘
```

Frontend (TanStack) stays as-is; this service owns **phone check-ins**. Case review in the browser still uses `ReviewSession` + ElevenLabs WebSocket.
