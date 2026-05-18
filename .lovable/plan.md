## Goal
Introduce the BDO navy blue (#1A2B4A) as a secondary highlight color and place the BDO logo in the app chrome.

## 1. Add the logo asset
- Copy `user-uploads://image.png` to `src/assets/bdo-logo.png`.
- Import it in `src/components/layout/AppSidebar.tsx` and render it in the sidebar header in place of the current "JL" navy square. Constrain height (~32px), preserve aspect ratio. Keep the "Judgment Ledger" wordmark text next to it (navy, bold, uppercase) so the brand pairing reads as "BDO  Judgment Ledger".
- Also add a small footer block at the bottom of the sidebar with the eyebrow label "Powered by" above a smaller version of the logo (~20px tall), so the brand shows up in two places.

## 2. Navy blue accent utility
- In `src/styles.css`, add a `.highlight-navy` utility: `color: #ffffff; background-color: #1A2B4A; padding: 0 6px;` for inline text highlights, plus a `.text-navy` utility (`color: #1A2B4A`) for headline emphasis.
- Add a `Highlight` component at `src/components/brand/Highlight.tsx` that wraps children in a `<mark class="highlight-navy">`. Lets us drop navy highlights anywhere with `<Highlight>text</Highlight>`.

## 3. Apply navy highlight in a few key places
Keep red as the dominant CTA color; navy is reserved for occasional emphasis.
- `src/routes/_app.index.tsx`: wrap one key word in the hero/section heading with `<Highlight>`.
- `src/routes/_app.cases.index.tsx`: wrap the keyword in the page title (e.g. "Cases") with `<Highlight>`.
- `src/routes/_app.curriculum.index.tsx`: wrap the keyword in the curriculum hero title with `<Highlight>`.
- Eyebrow labels stay red. Buttons stay red. Only the chosen heading words get the navy mark.

## Out of scope
- No layout, copy, or feature changes beyond placing the logo and the navy highlight component.
