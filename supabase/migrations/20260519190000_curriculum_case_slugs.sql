-- Human-readable URLs for curriculum cases (e.g. /curriculum/working-capital-bridge)

ALTER TABLE public.curriculum_cases
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.curriculum_cases SET slug = 'working-capital-bridge'
  WHERE id = 'c1111111-1111-1111-1111-111111111111';
UPDATE public.curriculum_cases SET slug = 'margin-compression-post-merger'
  WHERE id = 'c2222222-2222-2222-2222-222222222222';
UPDATE public.curriculum_cases SET slug = 'revenue-recognition-red-flags'
  WHERE id = 'c6666666-6666-6666-6666-666666666661';
UPDATE public.curriculum_cases SET slug = 'ebitda-bridge-basics'
  WHERE id = 'c6666667-6667-6667-6667-666666666672';
UPDATE public.curriculum_cases SET slug = 'recurring-revenue-mix'
  WHERE id = 'c3333333-3333-3333-3333-333333333333';
UPDATE public.curriculum_cases SET slug = 'carve-out-stand-alone-costs'
  WHERE id = 'c4444444-4444-4444-4444-444444444444';
UPDATE public.curriculum_cases SET slug = 'quality-of-earnings-adjustments'
  WHERE id = 'c6666668-6668-6668-6668-666666666683';
UPDATE public.curriculum_cases SET slug = 'leverage-and-covenant-headroom'
  WHERE id = 'c6666669-6669-6669-6669-666666666694';
UPDATE public.curriculum_cases SET slug = 'saas-cohort-quality'
  WHERE id = 'c5555555-5555-5555-5555-555555555555';
UPDATE public.curriculum_cases SET slug = 'roll-up-synergy-phasing'
  WHERE id = 'c666666a-666a-666a-666a-6666666666a5';
UPDATE public.curriculum_cases SET slug = 'marketplace-take-rate-and-liquidity'
  WHERE id = 'c666666b-666b-666b-666b-6666666666b6';
UPDATE public.curriculum_cases SET slug = 'downside-valuation-stress'
  WHERE id = 'c666666c-666c-666c-666c-6666666666c7';

-- Backfill any rows missing slug from title
UPDATE public.curriculum_cases
SET slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.curriculum_cases
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS curriculum_cases_slug_key ON public.curriculum_cases (slug);
