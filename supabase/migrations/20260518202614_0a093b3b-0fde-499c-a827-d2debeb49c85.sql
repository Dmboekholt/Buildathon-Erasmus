-- Add questions support and per-question answers/scores
ALTER TABLE public.curriculum_cases
  ADD COLUMN IF NOT EXISTS questions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.curriculum_attempts
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS per_question_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ALTER COLUMN written_insight SET DEFAULT '';

-- Clear existing seeded cases so the new long-form seed populates
DELETE FROM public.curriculum_attempts;
DELETE FROM public.curriculum_cases WHERE source = 'seeded';