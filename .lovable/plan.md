## Goal
Reframe the home route (`/`) from a "Dashboard" with two columns (Cases + Improvements) into an "Analytics" page that focuses purely on improvement signals across three categories: Decision Making, Insights, and Judgement. Keep "Browse cases" as the only entry point to cases from this page.

## Changes

### 1. Rename "Dashboard" to "Analytics"
- `src/routes/_app.index.tsx`: eyebrow `00. Dashboard` to `00. Analytics`, and refresh the hero heading/subcopy to fit an analytics framing (no em-dashes, per project rule).
- `src/components/layout/AppSidebar.tsx`: nav item label `Dashboard` to `Analytics` (keep `/` url, swap icon to `BarChart3`).
- `src/components/layout/TopNav.tsx`: tab label `Dashboard` to `Analytics` (rename `isDashboard` to `isAnalytics` for clarity).

### 2. Hero / top section
- Keep the `Browse cases` pill button on the top right (unchanged behavior).
- Remove the two-column section header row (`01. Cases` / `02. Improvements`).
- Keep a single horizontal divider line under the hero.

### 3. Below the line: Improvements only
Replace the current two-column grid with a single Improvements section composed of:

a. **Category score panel** (the "nice graph") at the top, full width:
   - Three categories: Decision Making, Insights, Judgement.
   - For each: a label, a numeric score (0 to 100), and a horizontal progress bar rendered with semantic tokens (`bg-muted` track, `bg-foreground` fill). Pure CSS, no chart lib.
   - Scores derived locally from the improvements list (count + priority weighting per category). Each improvement gets a `category` field of one of the three values.
   - Layout: 3 column grid on `md+`, stacked on mobile. Generous padding consistent with the rest of the page (`p-6` to `p-8`, `gap-8`).

b. **Improvement cards list** below the score panel:
   - Reuse current card style (title, priority badge top right, area/category as subtext).
   - Update seed data so each item has a `category` of Decision Making | Insights | Judgement, and `area` text reads naturally without em-dashes.
   - Single column on mobile, 2 columns on `md+`.

### 4. Data model tweak
- Extend the `Improvement` type with `category: "Decision Making" | "Insights" | "Judgement"`.
- Update the existing 4 seed entries to assign a category each, and add 2 more so all three categories are represented.

### 5. Cleanup
- Remove `listCases` import, `useQuery`/`useServerFn` usage, and `cases` rendering from `_app.index.tsx`.
- Remove now unused imports.

## Out of scope
- No backend or schema changes; scores are derived client side from seed data.
- No changes to `/cases` route or case detail pages.
- No chart library; the visualization is CSS progress bars to stay lightweight and on-brand.
