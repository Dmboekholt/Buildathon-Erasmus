-- Junior year tracks: 3 years x 4 assignments

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS junior_year int CHECK (junior_year BETWEEN 1 AND 3);

UPDATE public.profiles SET junior_year = 1 WHERE id = '11111111-1111-1111-1111-111111111111' AND junior_year IS NULL;
UPDATE public.profiles SET junior_year = 2 WHERE id = '22222222-2222-2222-2222-222222222222' AND junior_year IS NULL;
UPDATE public.profiles SET junior_year = 3 WHERE id = '33333333-3333-3333-3333-333333333333' AND junior_year IS NULL;

ALTER TABLE public.curriculum_cases
  ADD COLUMN IF NOT EXISTS junior_year int NOT NULL DEFAULT 1 CHECK (junior_year BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS learning_objective text NOT NULL DEFAULT '';

-- Map legacy difficulty to junior_year where unset
UPDATE public.curriculum_cases
SET junior_year = COALESCE(NULLIF(difficulty, 0), 1)
WHERE junior_year = 1 AND difficulty IS NOT NULL AND difficulty BETWEEN 1 AND 3;

UPDATE public.curriculum_cases SET sort_order = 1, junior_year = 1 WHERE id = 'c1111111-1111-1111-1111-111111111111';
UPDATE public.curriculum_cases SET sort_order = 2, junior_year = 1 WHERE id = 'c2222222-2222-2222-2222-222222222222';
UPDATE public.curriculum_cases SET sort_order = 3, junior_year = 2 WHERE id = 'c3333333-3333-3333-3333-333333333333';
UPDATE public.curriculum_cases SET sort_order = 4, junior_year = 2 WHERE id = 'c4444444-4444-4444-4444-444444444444';
UPDATE public.curriculum_cases SET sort_order = 1, junior_year = 3 WHERE id = 'c5555555-5555-5555-5555-555555555555';

UPDATE public.curriculum_cases SET learning_objective = 'Understand how receivables and inventory drive operating cash flow when revenue grows but cash does not.'
WHERE id = 'c1111111-1111-1111-1111-111111111111' AND learning_objective = '';

UPDATE public.curriculum_cases SET learning_objective = 'Diagnose margin misses after mergers when cost synergies look on track but gross profit does not.'
WHERE id = 'c2222222-2222-2222-2222-222222222222' AND learning_objective = '';

UPDATE public.curriculum_cases SET learning_objective = 'Separate recurring service revenue from project installation work when judging margin and cash quality.'
WHERE id = 'c3333333-3333-3333-3333-333333333333' AND learning_objective = '';

UPDATE public.curriculum_cases SET learning_objective = 'Stress-test carve-out stand-alone costs, TSAs, and inventory step-up amortization.'
WHERE id = 'c4444444-4444-4444-4444-444444444444' AND learning_objective = '';

UPDATE public.curriculum_cases SET learning_objective = 'Validate SaaS cohort economics: NRR, churn, CAC payback, and sustainable growth.'
WHERE id = 'c5555555-5555-5555-5555-555555555555' AND learning_objective = '';
