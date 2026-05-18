# Judgment ledger — design system

Austere, serious, enterprise financial software. A tool a bank or audit firm
would actually trust and pay for. Flat, restrained, confident, evidence-led.
Generous whitespace. No visual noise. When in doubt, remove decoration.

This document is the visual foundation. Every screen, component and element
must follow it. Do not deviate.

## Colour palette

| Token                       | Hex       | Use                                              |
|-----------------------------|-----------|--------------------------------------------------|
| Accent (crimson)            | `#D81B40` | Single primary button per screen, active nav/tab, the most important number. Never decoration, backgrounds or borders. |
| Primary text                | `#1A1A1A` | All primary copy                                  |
| Secondary / muted text      | `#6B7280` | Labels, captions, supporting copy                 |
| Placeholder / hint          | `#9CA3AF` | Input placeholders, hints                         |
| Page background             | `#F9FAFB` | Outer canvas                                      |
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
- Sentence case everywhere. Never Title Case. Never ALL CAPS.

## Shape & surface

- Borders: 1px hairline in `#E5E7EB`. Use borders to separate things — not
  shadows.
- No drop shadows, glows or blur anywhere.
- Radii: **8px** on buttons, inputs and small elements; **12px** on cards and
  panels.
- Cards: white background, 1px `#E5E7EB` border, 12px radius, ~20px internal
  padding.

## Buttons

Only two variants exist.

- **Primary** — solid `#D81B40` background, white text, 8px radius. One per
  screen.
- **Secondary** — white background, 1px `#E5E7EB` border, `#1A1A1A` text, 8px
  radius.

No other button styles. No ghost, no gradient, no shadow.

## Layout & spacing

- 8px spacing grid. Be generous with whitespace between sections.
- Hierarchy comes from **size and spacing**, not colour or weight.
- Metric / summary cards: small grey caption label on top, large monospaced
  number below.

## Navigation

Top navigation bar containing:

- A 30px crimson square logo mark with a white icon glyph
- The app name "Judgment ledger" beside it
- A one-line grey subtitle underneath
- Tab links: muted by default; active state uses crimson text with a 2px
  crimson underline. No other active treatment.

## Implementation notes

- Tokens live in `src/styles.css` under `@theme inline`. Components must
  reference semantic Tailwind classes (e.g. `bg-card`, `border-border`,
  `text-muted-foreground`, `text-accent`) — never raw hex.
- Status colours are exposed as `text-success`, `text-warning`, `text-danger`
  and are reserved for small indicators.
- Dark mode is intentionally disabled; tokens stay light across both roots.
