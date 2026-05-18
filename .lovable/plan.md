## Goal
Reskin the entire app to match BDO's bold, corporate, flat-rectangular identity. No code/feature changes — visuals only.

## 1. Design tokens (`src/styles.css`)
Rewrite the `@theme` block with the BDO palette and typography:

- Colors:
  - `--color-background: #FFFFFF`
  - `--color-foreground: #1A1A1A`
  - `--color-muted: #F2F2F2`, `--color-muted-foreground: #6B6B6B`
  - `--color-placeholder: #9A9A9A`
  - `--color-border / --color-input: #E4E4E4`
  - `--color-primary: #E40521`, `--color-primary-foreground: #FFFFFF`
  - `--color-accent: #E40521`
  - `--color-secondary: #1A2B4A` (navy, for wordmark / strong accents)
  - `--color-success: #2E7D32`, `--color-warning: #B7791F`
  - Sidebar tokens aligned to white surface + red active
- Radius: set all radius tokens to `0` (square corners everywhere).
- Type scale:
  - display 44/1.1 weight 700
  - section 24 weight 700
  - body 18/1.5 weight 400
  - caption 14 weight 400 (`#6B6B6B`)
- Font: load Archivo (400, 700) from Google Fonts via `__root.tsx` `<link>` tags, set `--font-sans` / `--font-display` to `"Archivo", "Inter", sans-serif`.

Add base layer rules:
- `body` font-size 18px, line-height 1.5, letter-spacing 0.
- Headings weight 700, near-black, tight tracking.
- New utility class `.eyebrow` → 14px, weight 700, uppercase, letter-spacing 0.08em, color `#E40521`.
- New utility `.btn-bdo` (solid red, white uppercase 15px/700, letter-spacing 0.05em, padding 16px 32px, no radius) as a fallback for places not using the shadcn Button.

## 2. Button + input primitives
- `src/components/ui/button.tsx`: change default variant to solid `bg-primary text-primary-foreground uppercase tracking-[0.05em] font-bold`, remove rounded classes, set `rounded-none`, padding 16/32. Keep variants but strip radii and shadows in each.
- `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`, `card.tsx`, `dialog.tsx`, `badge.tsx`, `tabs.tsx`: replace any `rounded-*` with `rounded-none`, strip `shadow-*`. Cards use `bg-card border border-border p-8`, no shadow.

## 3. Layout chrome
- `src/routes/__root.tsx`: inject Google Fonts `<link>` for Archivo 400/700; ensure body uses white bg.
- `src/components/layout/AppSidebar.tsx` (top nav): white bg, charcoal links weight 700, active/hover red `#E40521`, inactive `#6B6B6B`. Logo wordmark in navy `#1A2B4A`, bold. Add a solid red CONTACT block top-right (white uppercase text, no radius, padding 16/32).
- Add a reusable diagonal red accent block component used on hero/landing surfaces (`src/components/brand/DiagonalAccent.tsx`) — a `clip-path` red rectangle sliced diagonally.

## 4. Page surfaces
Sweep each route (`_app.index`, `_app.cases.*`, `_app.curriculum.*`, `_app.manager`) and:
- Replace gradients/glow/shadow utilities with flat surfaces.
- Replace `rounded-*` with `rounded-none`.
- Page titles → `text-[44px] font-bold leading-[1.1]`.
- Section labels → `eyebrow` class (red uppercase).
- Cards → `bg-[#F2F2F2] border border-border p-8`.
- Primary CTAs → default Button (red).
- Use the diagonal accent block on the home hero and curriculum hero only.

## 5. QA
- Visit `/`, `/cases`, `/curriculum`, `/manager` in the preview, screenshot each, verify: square corners, red CTAs, white bg, no shadows, Archivo loaded, eyebrows red uppercase.

## Out of scope
- No feature/logic changes. No content rewrites. Curriculum seeding logic untouched.
