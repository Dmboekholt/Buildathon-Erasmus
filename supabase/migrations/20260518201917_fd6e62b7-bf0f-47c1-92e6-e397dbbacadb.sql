
CREATE TABLE public.curriculum_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  era text,
  industry text,
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 10),
  case_text text NOT NULL,
  expected_insights text[] NOT NULL DEFAULT '{}',
  historical_answer text NOT NULL,
  ai_answer text NOT NULL,
  senior_reasoning text NOT NULL,
  source text NOT NULL DEFAULT 'seeded',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.curriculum_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.curriculum_cases(id) ON DELETE CASCADE,
  analyst_id text NOT NULL DEFAULT 'demo-analyst',
  analyst_level int NOT NULL DEFAULT 1,
  written_insight text NOT NULL,
  accuracy_score int NOT NULL DEFAULT 0,
  alignment_historical int NOT NULL DEFAULT 0,
  alignment_ai int NOT NULL DEFAULT 0,
  alignment_senior int NOT NULL DEFAULT 0,
  skill_indicators jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculum_attempts_analyst_created
  ON public.curriculum_attempts(analyst_id, created_at DESC);

CREATE TABLE public.curriculum_progress (
  analyst_id text PRIMARY KEY DEFAULT 'demo-analyst',
  level int NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.curriculum_progress (analyst_id, level) VALUES ('demo-analyst', 1);

ALTER TABLE public.curriculum_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_all_curriculum_cases ON public.curriculum_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY demo_all_curriculum_attempts ON public.curriculum_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY demo_all_curriculum_progress ON public.curriculum_progress FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER touch_curriculum_cases_updated_at
  BEFORE UPDATE ON public.curriculum_cases
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.curriculum_bump_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_level int;
  rolling_avg numeric;
  attempt_count int;
BEGIN
  SELECT level INTO current_level FROM public.curriculum_progress WHERE analyst_id = NEW.analyst_id;
  IF current_level IS NULL THEN
    INSERT INTO public.curriculum_progress (analyst_id, level) VALUES (NEW.analyst_id, 1);
    current_level := 1;
  END IF;

  SELECT COUNT(*), COALESCE(AVG(accuracy_score), 0)
    INTO attempt_count, rolling_avg
    FROM (
      SELECT accuracy_score FROM public.curriculum_attempts
      WHERE analyst_id = NEW.analyst_id AND analyst_level = current_level
      ORDER BY created_at DESC LIMIT 5
    ) AS recent;

  IF attempt_count >= 3 AND rolling_avg >= 80 AND current_level < 10 THEN
    UPDATE public.curriculum_progress
      SET level = current_level + 1, updated_at = now()
      WHERE analyst_id = NEW.analyst_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER curriculum_attempts_bump_level
  AFTER INSERT ON public.curriculum_attempts
  FOR EACH ROW EXECUTE FUNCTION public.curriculum_bump_level();
