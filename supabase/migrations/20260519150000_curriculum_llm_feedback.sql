-- LLM feedback fields on curriculum attempts

ALTER TABLE public.curriculum_attempts
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS skill_indicators jsonb NOT NULL DEFAULT '[]'::jsonb;
