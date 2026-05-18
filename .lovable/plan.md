# Judgment Ledger — Design System & Initial Scaffold

## Goal
Lock in an austere, enterprise-grade visual foundation before any feature work begins. Every future screen inherits from this system — no deviations.

## 1. Direction & Artifact

- Treat this project as a **web app** (TanStack Start template via `add_artifact`).
- Project name: **Judgment Ledger** — serious financial/audit tooling tone.
- No consumer polish: no gradients, no shadows, no rounded hero blobs, no decorative color.

## 2. Design Tokens (single source of truth)

Tokens live in `src/index.css` as CSS variables and are mapped in `tailwind.config.ts`. Components must only reference semantic tokens, never raw hex.

### Color (HSL in CSS, hex equivalents shown)
- `--accent: #D81B40` — crimson. Only: primary button, active nav/tab, single most-important number per screen.
- `--foreground: #1A1A1A` — primary text
- `--muted-foreground: #6B7280` — secondary text
- `--placeholder: #9CA3AF` — hints / placeholders
- `--background: #F9FAFB` — page background
- `--card: #FFFFFF` — cards, panels
- `--border: #E5E7EB` — every border and divider
- Status (small indicators only): `--success #2E7D32`, `--warning #B7791F`, `--danger #C0392B`
- No other colors. No gradients anywhere.

### Typography
- Font family: **Inter** (loaded via Google Fonts) for all UI text.
- Mono family: **JetBrains Mono** with `ui-monospace` fallback — used for *every* number, score, percentage, date, ID code, even inline.
- Exactly four text styles:
  - `text-page-title` — 22px / weight 500
  - `text-section` — 18px / weight 500
  - `text-body` — 15px / weight 400
  - `text-caption` — 13px / weight 400
- Only weights 400 and 500 exist. Tailwind `font-semibold`/`font-bold` removed from usage.
- Sentence case everywhere. No Title Case, no ALL CAPS, no `uppercase` utility.

### Shape & surface
- Borders: 1px hairline, `--border` only. Separation by border, not shadow.
- No `shadow-*`, no `blur-*`, no `ring-*` glow utilities anywhere.
- Radius: `--radius-sm: 8px` (buttons, inputs), `--radius-md: 12px` (cards, panels).
- Card: white bg, 1px border, 12px radius, 20px internal padding.

### Buttons (only two variants)
- **Primary**: solid `#D81B40` background, white text, 8px radius, no shadow. Used once per screen.
- **Secondary**: white bg, 1px `#E5E7EB` border, `#1A1A1A` text, 8px radius.
- All other shadcn button variants (ghost gradient, outline color, etc.) removed/overridden.

### Spacing & layout
- 8px base grid (Tailwind defaults already align).
- Generous whitespace between sections (min 32–48px).
- Hierarchy via size + spacing, never via color or weight.
- Metric card pattern: small grey caption label on top, large mono number below.

### Navigation
- Top nav bar:
  - 30px crimson square (8px radius) logo mark with a white icon glyph
  - App name "Judgment ledger" beside it (sentence case, 18px / 500)
  - One-line grey subtitle underneath
  - Tab/link active state: crimson text + crimson 2px underline

## 3. Files to Create / Modify

- `src/index.css` — replace token block with the palette above; load Inter + JetBrains Mono; reset radius vars; remove dark mode color drift (keep dark vars equal to light for now since this is enterprise-light only).
- `tailwind.config.ts` — extend `fontFamily.sans = ['Inter', ...]`, `fontFamily.mono = ['JetBrains Mono', 'ui-monospace', ...]`, add font-size tokens (`page-title`, `section`, `body`, `caption`), restrict `borderRadius` to `sm: 8px`, `md: 12px`.
- `src/components/ui/button.tsx` — keep only `primary` (crimson) and `secondary` (white+border) variants; remove shadows and uppercase.
- `src/components/layout/TopNav.tsx` — new component implementing the nav bar spec.
- `src/components/ui/MetricCard.tsx` — new reusable metric card (caption label + mono number).
- `src/pages/Index.tsx` — replace placeholder hero with an austere landing shell: TopNav + page title "Dashboard" + a row of 3 MetricCards using placeholder data + an empty "Recent judgments" section card. Demonstrates the system; no fake decoration.
- `DESIGN.md` (project root) — written design document containing all rules above, so future changes have a canonical reference.

## 4. Out of scope (this step)
- No data model, no auth, no backend, no Lovable Cloud yet.
- No real features — only the visual foundation + one demonstration screen.

## 5. Acceptance
- Opening `/` shows the new TopNav, sentence-case page title, three metric cards with mono numbers, and an empty section card.
- No shadows, no gradients, no bold weights, no non-palette colors in the rendered DOM.
- `DESIGN.md` exists and matches the spec.

## Technical notes
- Fonts loaded via `<link>` in `index.html` (Inter 400/500, JetBrains Mono 400/500) to avoid extra deps.
- Status colors exposed as `text-success`, `text-warning`, `text-danger` utilities but used only inside small badge/indicator components later.
- Dark mode disabled visually (tokens identical) — enterprise software stays light.
