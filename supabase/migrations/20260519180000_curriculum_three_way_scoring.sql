-- Three-way scoring alignments on attempts; model answers on cases

ALTER TABLE public.curriculum_attempts
  ADD COLUMN IF NOT EXISTS alignment_historical int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alignment_ai int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alignment_senior int NOT NULL DEFAULT 0;

-- Backfill model answers from historical outcomes where AI ideal path was not stored
UPDATE public.curriculum_cases
SET ai_answer = historical_answer
WHERE trim(coalesce(ai_answer, '')) = ''
  AND trim(coalesce(historical_answer, '')) <> '';
