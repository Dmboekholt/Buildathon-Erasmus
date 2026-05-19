# Quick start — run everything locally

You need **two terminals** for the full demo (frontend + phone check-ins).

## One-time setup

### 1. Install frontend dependencies (repo root)

```bash
cd /Users/abdelrahmanghonim/Buildathon-Erasmus
npm install
```

### 2. Root `.env` (Lovable / frontend)

Copy `.env.example` to `.env` and fill in at minimum:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or use publishable key as hackathon fallback — see backend README)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ELEVENLABS_AGENT_ID` (browser case-review agent — different from phone agent)
- `LOVABLE_API_KEY` (scores case reviews after voice session)

### 3. Backend `.env` (phone check-ins)

`backend/.env` should already have ElevenLabs + Supabase. Confirm:

- `ELEVENLABS_API_KEY` (with ConvAI permissions)
- `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 4. Python venv (one time)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Supabase SQL (recommended once)

In [Supabase SQL Editor](https://supabase.com/dashboard/project/qkzcprqeamfqkvnlzooa/sql/new), run:

`backend/scripts/APPLY_IN_SUPABASE_SQL_EDITOR.sql`

---

## Terminal 1 — Frontend (Lovable app)

```bash
cd /Users/abdelrahmanghonim/Buildathon-Erasmus
npm run dev
```

Open **http://localhost:5173** (or the URL Vite prints).

- Junior: `/` · `/cases` · `/cases/a1111111-1111-1111-1111-111111111111`
- Manager: `/manager`

---

## Terminal 2 — Python API (phone check-ins)

```bash
cd /Users/abdelrahmanghonim/Buildathon-Erasmus/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

---

## Terminal 3 — Trigger a phone call (optional)

**Important:** The trigger command only *starts* the call. Your phone conversation continues for several minutes after the script prints `Success`.

Recommended (shows tasks + questions, then dials):

```bash
cd backend && source .venv/bin/activate
python scripts/trigger_call.py
```

Or with the API running:

```bash
curl -X POST "http://127.0.0.1:8000/check-ins/trigger/11111111-1111-1111-1111-111111111111?force=true"
```

Sam Patel’s phone must be set in Supabase `profiles.phone` (e.g. `+31684070115`).

Preview what the agent knows before calling:

```bash
curl http://127.0.0.1:8000/check-ins/11111111-1111-1111-1111-111111111111/context
```

---

## Optional — save call transcripts (webhook)

**Terminal 4:**

```bash
ngrok http 8000
```

1. Copy the `https://....ngrok-free.app` URL.
2. Set in `backend/.env`: `PUBLIC_BASE_URL=https://....ngrok-free.app`
3. Restart uvicorn (Terminal 2).
4. ElevenLabs → Agents → Settings → Webhooks →  
   `https://....ngrok-free.app/webhooks/elevenlabs` (post-call transcription).

---

## Client demo — hear “Hi Sam” on the phone

In `backend/.env`:

```env
ELEVENLABS_PROMPT_MODE=demo
```

Then:

```bash
cd backend && source .venv/bin/activate
python scripts/trigger_call.py
```

Confirm the script prints: `Opening line sent to ElevenLabs: Hi Sam, I'm calling from Judgment Ledger...`

In ElevenLabs agent settings, **clear the first message field** (or leave a one-line backup with `{{junior_name}}`) so the API opener is used.

If you still do not hear the name, switch once to:

```env
ELEVENLABS_PROMPT_MODE=dashboard
```

and set the first message in ElevenLabs UI to the line in `backend/docs/elevenlabs-agent-prompt.md`.

---

## Client demo — call ends right after “Hi Sam…”?

That usually means the agent used **`end_call`** too soon (common with Nova / user-research templates).

**Fix:** use `demo` mode (default in `backend/.env`):

```env
ELEVENLABS_PROMPT_MODE=demo
```

This will:

- Say **Hi Sam…** and **ask the first question immediately** (no “Ready?”)
- Tell the agent **not to hang up** for the first few minutes
- Disable **`end_call`** for this outbound call via API

Then:

```bash
cd backend && source .venv/bin/activate
python scripts/trigger_call.py
```

**When you answer:** say something back (e.g. “Hi, yes go ahead”) so the agent continues.

In ElevenLabs agent settings, also remove **`end_call`** from early workflow if you use `dashboard` mode.

---

## Twilio trial (no upgrade) — make it work

Trial always plays: *“You have a trial account. Press any key to execute your code.”*  
Our code **cannot** remove that. See **`backend/docs/twilio-trial-playbook.md`**.

**Reliable sequence:**

1. [Verify your phone](https://www.twilio.com/console/phone-numbers/verified) in Twilio (trial only calls verified numbers).
2. Run `python scripts/trigger_call.py` — read the trial steps **before** you answer.
3. Answer → press **one** keypad digit **immediately** → **count to 10 in silence** (do not hang up).
4. Hear *“Hi Sam…”* → say *“Hi, yes — go ahead.”*
5. Use the **handset keypad** (not CarPlay/Bluetooth) if the call drops after pressing a key.

**Tell the client:** one Twilio safety line, then the Judgment Ledger check-in.

**Backup if phone fails in the room:** `npm run dev` → Cases → Thermanova → **Start review session** (browser voice, no Twilio).

Optional later: upgrade Twilio to drop the trial message entirely.

---

## Demo checklist

| Step | Command / URL |
|------|----------------|
| Frontend | `npm run dev` → http://localhost:5173 |
| Backend | `uvicorn app.main:app --reload --port 8000` |
| Case review in browser | Cases → Thermanova → Start review session |
| Phone check-in | `curl -X POST .../check-ins/trigger/11111111-...?force=true` |
