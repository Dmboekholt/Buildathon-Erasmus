## Fix learning curriculum cases

### Root cause
DB inspection shows every seeded case is 493-722 chars with `questions = []`. The InProgressCase view has nothing to render because there are no questions. Two things to fix: bad seed data, and a prompt that does not actually produce the structure we want.

### 1. Clear bad seed data
Migration: `DELETE FROM curriculum_attempts; DELETE FROM curriculum_cases WHERE source='seeded';` so the next visit re-seeds from scratch with the new prompt.

### 2. Rewrite the seed prompt (`src/lib/curriculum.functions.ts`)
Switch from one big blob to a strict section-based case structure. Each generated case must include all of:
- **Background and deal context** (what is happening, who the players are, timeline)
- **Financials** (revenue, EBITDA, margins, growth, leverage, multiples, share price/market cap, ideally a small text-table)
- **Management and governance** (CEO, CFO, board dynamics, prior track record, incentives)
- **Risks and red flags** (concrete signals an analyst could see at the time)
- **Specific deal details** (price, structure, financing, comparables, covenants, synergies)

Tighten:
- `case_text` must be 1500+ characters, written as multiple labeled paragraphs (the section headers above appear inside `case_text`).
- `questions` minimum 3, maximum 6, each with `id`, `prompt`, `expected_answer`, `senior_answer`, `ai_answer`.
- At least 2 questions must require numerical reasoning, at least 1 must be about risk or pushback.
- Generate one case at a time (already the pattern) so a single bad response does not kill the batch.

### 3. Make seed failures visible
- If `seedCurriculumIfEmpty` ends with `seeded === 0` and the DB is still empty, surface that on the Challenge page (instead of an empty cards grid with no signal) with a Retry button.
- Log per-case failure reason on the server so we can see what the gateway returned.

### 4. Defensive UI in `_app.curriculum.index.tsx`
In `InProgressCase`, if `c.questions.length === 0` after load, render an explicit "This case is missing questions. Re-seed the library." block with a Re-seed action, so a future bad row never silently hides the form.

### 5. Out of scope
No schema changes beyond the data wipe. No new auth, no Manager Dashboard, no Senior Upload.

### Files touched
- Migration: clear `curriculum_cases` (seeded) + `curriculum_attempts`.
- `src/lib/curriculum.functions.ts`: rewrite seed prompt and validation; better error surface from seed.
- `src/routes/_app.curriculum.index.tsx`: empty-state and missing-questions fallbacks.
