## Changes to Learning Curriculum module

### 1. Sidebar restructure (`AppSidebar.tsx`)
- Remove the collapsible "Learning Curriculum" group with sub-items.
- "Learning Curriculum" becomes a single top-level item → `/curriculum` (Challenge view only).
- Add a separate top-level "Manager Dashboard" item directly under "Cases" → `/manager`.
- Remove Senior Upload entry and its route file (`_app.curriculum.upload.tsx`).

### 2. Routes
- Delete `_app.curriculum.upload.tsx`.
- Move manager view: delete `_app.curriculum.manager.tsx`, create `_app.manager.tsx` (empty placeholder, same content).
- Simplify `_app.curriculum.tsx` layout: remove tab nav (no more sub-pages); keep progress ladder header + `<Outlet />`.
- Rewrite `_app.curriculum.index.tsx` for the new case flow (below).

### 3. Case content overhaul (DB + seed)
Migration on `curriculum_cases`:
- Add `questions jsonb not null default '[]'` — array of `{ id, prompt, expected_answer, senior_answer, ai_answer }`.
- Keep `case_text` but expect much longer content (multi-paragraph financial cases involving multiples, comparables, LBO math, accretion/dilution, restructuring, etc.).
- Drop reliance on single `historical_answer` / `ai_answer` / `senior_reasoning` for the comparison view (kept for back-compat, unused going forward).

Re-seed: replace `seedCurriculumIfEmpty` to generate ~8 in-depth cases (e.g. RJR Nabisco LBO, AOL–Time Warner multiples, Kraft–Heinz synergies, Valeant roll-up, WeWork S-1, GE conglomerate discount, Anheuser-Busch InBev leverage, Lehman repo 105). Each case:
- 600–1200 word narrative with financials, multiples, capital structure.
- 4–6 structured questions (valuation multiple to apply, implied EV, key risk, recommended action, etc.).
- Per-question `expected_answer` (historical/textbook), `senior_answer` (senior-style reasoning), `ai_answer` (AI's take).

### 4. Attempt model (DB)
Replace `written_insight` single-string usage:
- Add `answers jsonb not null default '{}'` on `curriculum_attempts` — `{ [questionId]: userAnswer }`.
- Add `per_question_scores jsonb not null default '{}'` — `{ [questionId]: { score, feedback } }`.
- Keep aggregate `accuracy_score`, `alignment_*`, `feedback` (now computed as averages / overall summary).

### 5. Challenge UX (`_app.curriculum.index.tsx`)
Three-state flow:
1. **Browse**: list of available cases (title, era, industry, difficulty). Each row has a **Start case** button.
2. **In-progress**: full case text on top; below it, every question rendered with its own textarea. Sticky "Check answers" button at bottom (disabled until all answered). User can save/exit and resume (in-progress state held in component; no DB draft needed for MVP).
3. **Reviewed**: after submit, for each question show 4 columns/blocks:
   - Your answer
   - Expected (historical) answer
   - Senior's answer
   - AI's answer
   - Per-question score + short feedback
   Plus overall accuracy, alignment metrics, and progression toward next level. Buttons: **Try another case**, **Retry this case**.

### 6. Server functions (`curriculum.functions.ts`)
- Update `seedCurriculumIfEmpty` to emit the new long-form + questions schema.
- Replace `submitAttempt({ caseId, answers })`: AI scores each `{question, userAnswer, expected_answer, senior_answer}` and returns per-question `{score, feedback}` + aggregate metrics; persists into new columns; trigger continues to bump level.
- Remove `submitSeniorCase` (senior upload gone).
- Keep `listCases`, `getCase`, `getProgress`, `listAttempts`.

### 7. Out of scope
- No new auth, no draft persistence, no editing of seeded cases, no charts in Manager Dashboard (still placeholder), no MC questions.

### Files touched
- `src/components/layout/AppSidebar.tsx` — restructure nav.
- `src/routes/_app.curriculum.tsx` — strip tabs.
- `src/routes/_app.curriculum.index.tsx` — full rewrite (browse / in-progress / reviewed).
- `src/routes/_app.curriculum.upload.tsx` — delete.
- `src/routes/_app.curriculum.manager.tsx` — delete.
- `src/routes/_app.manager.tsx` — create (placeholder).
- `src/lib/curriculum.functions.ts` — rewrite seed + submit, remove senior upload.
- Migration: add `questions` to `curriculum_cases`; add `answers` + `per_question_scores` to `curriculum_attempts`; re-seed flag (clear existing seeded rows so new long-form cases populate on next load).
