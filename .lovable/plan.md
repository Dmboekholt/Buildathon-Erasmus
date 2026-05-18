## Goal

When a review session ends, capture the transcript, send it to an LLM for scoring, show the result inline on the case page, and update the home page Improvements list (adjust priority, append new ones).

## 1. Database

New `improvements` table (replaces hardcoded list in `_app.index.tsx`):

- `id` uuid pk
- `title` text
- `area` text
- `category` text  (Decision Making | Insights | Judgement)
- `priority` text  (High | Medium | Low)
- `status` text default `'open'`  (open | resolved)
- `source_debrief_id` uuid nullable
- `created_at`, `updated_at` timestamps

Seed with the 6 items currently hardcoded.

Reuse existing `debriefs` table for transcript + evaluation:
- `transcript` text: full plain-text transcript
- `evaluation_json` jsonb: `{ overall_score, strengths[], gaps[], summary }`
- `improvement_items` jsonb: snapshot of LLM proposed updates
- `status`: pending -> scored
- Add `case_id uuid` column so a debrief is tied to its case (today only `task_id` exists).

## 2. Server functions (`src/lib/review.functions.ts`)

- `saveDebrief({ caseId, transcript })`: inserts a `debriefs` row, returns id.
- `scoreDebrief({ debriefId })`:
  - loads debrief + case metadata + current open improvements
  - calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured output:
    ```
    { overall_score: 0-100, strengths: string[], gaps: string[], summary: string,
      improvement_updates: [{ id?, action: "lower"|"raise"|"keep"|"resolve", reason }],
      new_improvements: [{ title, area, category, priority }] }
    ```
  - applies updates: adjusts `priority` (one step up/down), marks resolved, inserts new rows (tagged with `source_debrief_id`)
  - writes `evaluation_json` + `improvement_items` back to debrief, status -> scored
- `getLatestDebriefForCase({ caseId })`: for the inline result panel.
- `listImprovements()`: for the home page.

## 3. ReviewSession component

- Capture transcript exactly as today, but on `End session`:
  1. Format `transcriptRef.current` into a readable string (`role: text` per line).
  2. Call `saveDebrief`, then `scoreDebrief`.
  3. While running, show "Scoring..."; on success render a result card with score, strengths, gaps, summary, and the list of improvement changes applied. On error show retry.

## 4. Home page

`_app.index.tsx` currently uses a hardcoded `improvements` array. Switch to:
- `useQuery(['improvements'], listImprovements)` filtered to `status = 'open'`.
- Keep the existing category grouping + score visual. No layout change.

## 5. Out of scope

- No new dedicated debrief page.
- No transcript display UI beyond raw text in DB.
- No auth/RLS changes (project uses demo-open policies today, mirror that on the new table).

## Technical notes

- Use Lovable AI Gateway via the AI SDK pattern in tanstack server functions; `LOVABLE_API_KEY` is already set.
- Use AI SDK `Output.object` with Zod schema for reliable structured output.
- Adjustment rule: `lower` moves High to Medium to Low (Low resolves only via `resolve`); `raise` moves Low to Medium to High.
- New improvements default to `status='open'` and `source_debrief_id` set.
