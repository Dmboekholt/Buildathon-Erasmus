# BDO Coach — design system

Calm, restrained, enterprise software for junior consultants. Flat, evidence-led,
confident. Generous whitespace. Clear, bordered boxes. No visual noise.

This document is the visual foundation. Every screen, component and element
must follow it. Do not deviate.

## No emojis or symbols

- Never use emoji characters (✨ 🎯 🔥 ⭐ ✅ etc.) anywhere in UI copy,
  headings, buttons, list items, toasts or empty states.
- Never use decorative unicode symbols as content — no sparkles, arrows (→),
  checkmarks (✓ ✔), stars (★), bullet dots (•) or similar.
- Do not place decorative round dots, sparkles or icon glyphs next to section
  headings. Headings stand alone.
- Lucide icons are allowed **only** as navigation/affordance signals
  (sidebar items, back-arrow on a back link, upload glyph on an upload field).
  They are never used inside list content, headings or as decoration.

## Colour palette

| Token                       | Hex       | Use                                              |
|-----------------------------|-----------|--------------------------------------------------|
| Accent (BDO red)            | `#EE3124` | Single primary button per screen, active nav marker, the most important number. Never decoration, backgrounds or borders. |
| Primary text                | `#1A1A1A` | All primary copy                                  |
| Secondary / muted text      | `#6B7280` | Labels, captions, supporting copy                 |
| Placeholder / hint          | `#9CA3AF` | Input placeholders, hints                         |
| Page background             | `#FCFCFC` | Outer canvas                                      |
| Card / panel surface        | `#FFFFFF` | Cards, panels, nav surface                        |
| Border / divider            | `#E5E7EB` | Every border, divider and hairline                |
| Status — success            | `#2E7D32` | Small result indicators only                      |
| Status — warning            | `#B7791F` | Small result indicators only                      |
| Status — danger             | `#C0392B` | Small result indicators only                      |

No other colours anywhere. No gradients, ever.

## Typography

- Font: **Inter** for all UI text.
- Mono: **JetBrains Mono** (with `ui-monospace` fallback) for **every** number,
  score, percentage, date and ID code — even inline within prose.
- Only four text styles exist:
  - Page title — 22px / weight 500
  - Section heading — 18px / weight 500
  - Body — 15px / weight 400
  - Caption — 13px / weight 400
- Only two weights exist: **400** and **500**. Never 600, 700 or bold.
- Sentence case everywhere. Never Title Case. Never ALL CAPS (small uppercase
  tags in mono are allowed for status pills only).

## Shape & surface

- Borders: 1px hairline in `#E5E7EB`. Use borders to separate things — not
  shadows.
- No drop shadows, glows or blur anywhere.
- Radii: **4px (rounded-sm)** on buttons, inputs, cards and panels. Crisp
  rectangles. No pill or fully-rounded shapes.
- Cards: white background, 1px `#E5E7EB` border, 4px radius. Rows inside a
  card are separated by `divide-y divide-border`, not by spacing.

## Buttons

Only two variants exist.

- **Primary** — solid `#EE3124` background, white text, 4px radius. One per
  screen.
- **Secondary** — white background, 1px `#E5E7EB` border, `#1A1A1A` text, 4px
  radius.

No other button styles. No ghost, no gradient, no shadow.

## Layout & spacing

- 8px spacing grid. Be generous with whitespace between sections.
- Hierarchy comes from **size and spacing**, not colour or weight.
- **Split-screen pattern**: dashboard surfaces use a two-column grid
  (`grid grid-cols-1 md:grid-cols-2 gap-8 items-start`). Each column is a
  bordered white box with a section heading above it. Collapses to one column
  below `md`.
- Metric / summary cards: small grey caption label on top, large monospaced
  number below.

## Navigation

Left sidebar containing:

- A 32px BDO red square logo mark with the white "BDO" wordmark
- The app name "BDO Coach" beside it
- A one-line grey subtitle underneath ("Junior debriefs")
- Nav items: muted by default; active state uses a thin 1px-wide, 16px-tall
  BDO red marker on the left edge of the row plus a muted background. No
  other active treatment.

## Implementation notes

- Tokens live in `src/styles.css` under `@theme inline`. Components must
  reference semantic Tailwind classes (e.g. `bg-card`, `border-border`,
  `text-muted-foreground`, `text-accent`) — never raw hex.
- Status colours are exposed as `text-success`, `text-warning`, `text-danger`
  and are reserved for small indicators.
- Dark mode is intentionally disabled; tokens stay light across both roots.
