## Goal

Pivot the project from "BDO Coach" (tasks + ElevenLabs debriefs) to **Judgment Ledger** — a case-review app for investment memoranda. Restore the original crimson design system, replace the sidebar shell with a top nav, and build `/cases` and `/cases/$caseId` backed by a new `work_products` table.

The existing BDO tasks/debriefs feature, the ElevenLabs server functions, and the current Home/Tasks routes are removed. The Supabase tables `profiles`, `tasks`, `artifacts`, `debriefs` and the `task-artifacts` bucket are left in place (out of scope to drop) but no longer referenced by the app.

## 1. Design system — restore Judgment Ledger

- Replace `DESIGN.md` with the uploaded crimson `#D81B40` version.
- Update `src/styles.css` tokens: accent `#D81B40`, page bg `#F9FAFB`, card radius 12px, button radius 8px. Inter for UI, JetBrains Mono for all numbers/dates/IDs. Two weights only (400/500). Sentence case.

## 2. Database

New migration:

```sql
create table public.work_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text,
  company text,
  industry text,
  mode text check (mode in ('historical','current')),
  level int default 1,
  content jsonb,
  created_at timestamptz not null default now()
);
alter table public.work_products enable row level security;
create policy "Public read" on public.work_products for select using (true);
```

After migration is approved and types regenerate, seed the `thermanova` row via `supabase--insert` with the full JSON from the spec (slug, title, company, industry, mode=current, level=3, content=<full JSON>).

## 3. Shell — TopNav replaces AppShell

- New `src/components/layout/TopNav.tsx`: 30px crimson square logo with white glyph, app name "Judgment ledger", grey subtitle "Investment case reviews". Tabs: **Dashboard** (→ `/`) and **Cases** (→ `/cases`). Active tab = crimson text + 2px crimson underline. No other tab styling.
- New `src/components/ui/MetricCard.tsx`: small grey caption label on top, large monospaced number below; bordered white card. (Available for later use; not required on Cases screens but the spec calls out the component.)
- Replace the `_app` layout: rename `src/routes/_app.tsx` to render `<TopNav />` + `<Outlet />`. Drop the sidebar entirely.

## 4. Routes

- **`src/routes/_app.index.tsx`** (Dashboard, `/`): minimal placeholder — page title "Dashboard", caption "Investment case reviews", and a single primary link to "Browse cases" → `/cases`. (Spec keeps Dashboard but does not specify content.)
- **`src/routes/_app.cases.index.tsx`** (`/cases`): server fn `listCases()` reads `id, slug, title, company, industry, mode, level` from `work_products`. Renders a responsive grid of shadcn `Card`s. Each card: title (section heading), company (body), industry (caption), a `Badge` for `mode`, and "Level N" with the N in JetBrains Mono. The entire card is a `<Link to="/cases/$caseId" params={{ caseId: id }}>`.
- **`src/routes/_app.cases.$caseId.tsx`** (`/cases/:caseId`): server fn `getCase({ id })` returns one row. Render sections in order:
  1. Header — title, company, industry, mode `Badge`.
  2. Investment highlights — bulleted list of `content.investment_highlights_as_written` (text-only, plain list, no decorative icons per existing "no symbols" tooling — but spec said follow uploaded DESIGN.md which does not mention this; render as a simple `<ul>` with neutral list markers).
  3. Company profile — `content.company_profile.description` + a small table of `divisions` (name, FY2024 revenue share).
  4. Financials — shadcn `Table` of `content.financials.historical`: columns FY, Revenue, EBITDA, EBITDA margin. All numeric cells use JetBrains Mono. Show currency caption.
  5. Decisions — group `content.decisions` by `section` (Forecast, Market, Growth Strategy, Risks, Valuation, SWOT). For each decision render only `claim` and `analyst_rationale_as_written`. **Never** render `examiner_note`, `weak_spot`, `coaching_priorities`, `scoring_dimensions`, `id`, or `section` fields as visible content.
  6. Management — `content.management.summary` only.
  7. Primary `Button`: "Start review session" (no `onClick`, `disabled={false}`, placeholder).
- Delete or stub: `src/routes/_app.tasks.index.tsx`, `src/routes/_app.tasks.$taskId.tsx`, `src/routes/api/public/elevenlabs-webhook.ts`, `src/lib/tasks.functions.ts`, `src/lib/prompts.ts`, `src/lib/ai.server.ts`, `src/lib/demo.ts`. (Keeping the files orphaned risks build breakage from broken imports — safer to delete.)

## 5. Server functions

New `src/lib/cases.functions.ts`:

```ts
export const listCases = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("work_products")
    .select("id, slug, title, company, industry, mode, level")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getCase = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("work_products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw notFound();
    return row;
  });
```

`supabaseAdmin` is fine here because RLS allows public read anyway; using it keeps the call available from SSR with no session.

## 6. Out of scope

- Don't drop the old `tasks/profiles/artifacts/debriefs` tables or the storage bucket (the user can remove later).
- Don't touch ElevenLabs secrets.
- "Start review session" button does nothing yet.

## Files touched

- `DESIGN.md` (rewrite)
- `src/styles.css` (revert tokens to crimson)
- `src/components/layout/AppShell.tsx` (delete)
- `src/components/layout/TopNav.tsx` (new)
- `src/components/ui/MetricCard.tsx` (new)
- `src/routes/_app.tsx` (use TopNav)
- `src/routes/_app.index.tsx` (Dashboard placeholder)
- `src/routes/_app.cases.index.tsx` (new)
- `src/routes/_app.cases.$caseId.tsx` (new)
- `src/routes/_app.tasks.*.tsx`, `src/routes/api/public/elevenlabs-webhook.ts`, `src/lib/tasks.functions.ts`, `src/lib/prompts.ts`, `src/lib/ai.server.ts`, `src/lib/demo.ts` (delete)
- `src/lib/cases.functions.ts` (new)
- New migration + seed insert for `work_products`
