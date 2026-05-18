## Goal

Cleaner, calmer Home page: Tasks left, Improvement list right, both shown as bordered boxes. Remove all decorative emojis and symbol glyphs throughout the app. Update DESIGN.md to reflect BDO branding and the new "no emojis or symbols" rule.

## Changes

### 1. DESIGN.md — rebrand + new rules
- Rename the doc from "Judgment ledger" to "BDO Coach".
- Swap accent crimson `#D81B40` → BDO red `#ee3124`.
- Add a new section: **No emojis or symbols** — never use emoji characters, decorative unicode symbols (sparkles, arrows, checkmarks, bullets like •, etc.) or icon glyphs as content. Icons from the lucide set are allowed only for navigation affordances (sidebar items), never inside headings or list content.
- Add a **Layout patterns** note: two-column split-screen (`grid-cols-2 gap-8`) for dashboard sections; each section is a bordered white box (`border border-border rounded-sm`, no shadow) with `divide-y` rows.

### 2. Home page (`src/routes/_app.index.tsx`)
- Replace the stacked layout with `grid grid-cols-2 gap-8 items-start`.
- Left column: **Tasks** — section header with "View all" link on the right, then a bordered box containing rows (title, then a muted line with `ID`, `Due …`, and a small uppercase status pill, all in JetBrains Mono).
- Right column: **Improvement list** — section header (no sparkle icon), bordered box, one improvement per row, plain sentence text.
- Remove the sparkle/`Sparkles` icon next to "Improvement list" and any other emoji/symbol content.
- Keep the loading/empty states as plain sentences ("Loading…" → "Loading", "No tasks yet").
- Responsive: collapse to single column under `md` (`grid-cols-1 md:grid-cols-2`).

### 3. App shell (`src/components/layout/AppShell.tsx`)
- Sidebar item active state: thin BDO-red pill marker on the left edge of the active row (matches the chosen direction), instead of any background-only highlight.
- Confirm no emoji/symbol characters anywhere in nav, header, or footer copy.

### 4. Sweep for emojis/symbols
- Grep the `src/` tree for emoji characters and decorative symbols (✓, ★, •, →, ✨, etc.) and remove them. Replace bullet-prefixed strings with plain text rows; rely on `divide-y` borders for separation.
- Audit `src/routes/_app.tasks.$taskId.tsx` and `src/routes/_app.tasks.index.tsx` for the same.

### 5. Tokens (`src/styles.css`)
- No structural changes needed — palette is already BDO red. Verify `--radius` defaults map cleanly to `rounded-sm` boxes used in the chosen direction; adjust card radius token if needed so cards render as crisp rectangles (≤ 4px radius) per the new "clear boxes" aesthetic.

## Out of scope
- No changes to server functions, ElevenLabs pipeline, DB schema, or auth.
- No new routes.

## Files touched
- `DESIGN.md`
- `src/routes/_app.index.tsx`
- `src/components/layout/AppShell.tsx`
- `src/routes/_app.tasks.$taskId.tsx`, `src/routes/_app.tasks.index.tsx` (emoji sweep only)
- `src/styles.css` (radius token only, if needed)
