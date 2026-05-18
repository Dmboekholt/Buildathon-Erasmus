## Goal

Build the Learning Curriculum module: historical case library, analyst challenge interface with three-way scoring (historical / AI / senior reasoning), 10-level career ladder progression, senior upload portal, and an empty Manager Dashboard tab. Seeds with 8 famous historical cases. Single shared demo analyst.

## 1. Sidebar restructure

In `AppSidebar.tsx`, replace the flat `Learning Curriculum` entry with a collapsible group containing three sub-items:

- Challenge (`/curriculum`)
- Senior Upload (`/curriculum/upload`)
- Manager Dashboard (`/curriculum/manager`)

Use `SidebarMenuSub` from the shadcn sidebar primitives. Keep Analytics and Cases as-is.

## 2. Database (one migration)

New tables (RLS on, demo-open policy mirroring existing tables):

`curriculum_cases`

- `id`, `title`, `era`, `industry`, `difficulty` int 1-10
- `case_text` text (the scenario the analyst reads)
- `expected_insights` text[] (key points used during scoring)
- `historical_answer` text (what actually happened + senior team conclusion)
- `ai_answer` text (AI's own take)
- `senior_reasoning` text (senior-style explanation)
- `source` text ('seeded' | 'senior_upload')
- `created_at`, `updated_at`

`curriculum_attempts`

- `id`, `case_id` fk, `analyst_id` text default `'demo-analyst'`
- `analyst_level` int (1-10, snapshot at attempt time)
- `written_insight` text
- `accuracy_score` int 0-100
- `alignment_historical` int 0-100
- `alignment_ai` int 0-100
- `alignment_senior` int 0-100
- `skill_indicators` jsonb (e.g. `{ insight, risk_awareness, pattern_recognition }` each 0-100)
- `feedback` text
- `created_at`

`curriculum_progress`

- `analyst_id` text pk default `'demo-analyst'`
- `level` int default 1
- `updated_at`

Trigger: after each attempt insert, recompute rolling-window accuracy (last 5 attempts at current level). If avg >= 80, increment level (cap 10).

## 3. Server functions (`src/lib/curriculum.functions.ts`)

- `seedCuriculumIfEmpty()`: if `curriculum_cases` is empty, generate 8 famous historical cases (Enron 2001, LTCM 1998, AOL-Time Warner 2000, Lehman 2008, Worldcom 2002, Theranos, Wirecard, Kodak digital transition) via Lovable AI Gateway with `Output.object` schema producing all fields at once. Difficulty spread 1-8.
- `listCases({ level })`: returns cases with `difficulty <= level + 1` not yet attempted (or fewest attempts first).
- `getCase({ id })`: returns case text and expected insights only (no spoilers).
- `getRevealedCase({ id, attemptId })`: returns historical_answer, ai_answer, senior_reasoning, expected_insights for post-submit reveal.
- `submitAttempt({ caseId, writtenInsight })`: calls AI with case + expected insights + analyst answer; returns structured `{ accuracy_score, alignment_historical, alignment_ai, alignment_senior, skill_indicators, feedback }`; inserts attempt; trigger recomputes level.
- `getProgress()`: returns current level + last 10 attempts + rolling accuracy + next-level threshold.
- `submitSeniorCase({ rawText, title })`: AI converts raw text into the full structured case (all five generated fields) and inserts as `source='senior_upload'`.
- `listAttempts({ limit })`: for the progress timeline.

All AI calls use `google/gemini-3-flash-preview` via the existing fetch-based pattern in `review.functions.ts` (consistent with the codebase).

## 4. Routes

- `src/routes/_app.curriculum.tsx` (existing, rewrite): layout route with `<Outlet />` plus a level/progress header card.
- `src/routes/_app.curriculum.index.tsx`: Challenge interface.
  - Auto-triggers seeding on first mount if empty.
  - Picks a case appropriate for current level, shows case text + expected-insight count.
  - Textarea for written insight + Submit button.
  - On submit: shows scoring breakdown (4 progress bars + skill indicators) and a three-column reveal: Historical Answer | AI Answer | Senior Reasoning.
  - Button to load the next case.
- `src/routes/_app.curriculum.upload.tsx`: Senior Upload Portal.
  - Title + large textarea for the raw case material. Submit converts via AI and lists the resulting case.
  - Below: table of recent analyst attempts (case title, score, date) for senior review.
- `src/routes/_app.curriculum.manager.tsx`: empty Manager Dashboard placeholder. Header + "Coming in a later module." copy. No data wiring.

## 5. Progression UX

Curriculum layout header shows:

- Level name (Analyst Basics ... Expert Advisor) + year number
- Horizontal 10-segment ladder, current segment filled
- Rolling accuracy (last 5 at current level) with 80% target indicator
- "1 case from promotion" type hint when close

## 6. Out of scope

- No multi-user auth (single `'demo-analyst'`).
- No multiple-choice mode (written insight only).
- No edit/delete for senior-uploaded cases.
- No charts on Manager Dashboard.
- No integration with the existing case-review flow (separate module).

## Technical notes

- Lovable AI Gateway: reuse the inline `fetch` + JSON-schema validation pattern from `review.functions.ts`. `LOVABLE_API_KEY` is already set.
- Seeding runs server-side, idempotent via a `SELECT count` guard. Single bulk call returns all 8 cases.
- Scoring prompt asks the model for 0-100 alignment vs each of historical/ai/senior, an overall accuracy, three skill indicators, and short feedback. Strict zod schema.
- Trigger uses `plpgsql` to compute rolling avg over last 5 attempts where `analyst_level = current level` and bump level when >= 80.
- No em-dash or en-dash anywhere (per project memory).

&nbsp;

prefill senior answers, so when the analyst is done with writing up his answers and asks the ai to check it, the ai scores the analysts answers, gives it a model answer and also shows the senior answer 