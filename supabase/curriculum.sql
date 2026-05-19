-- Curriculum (training cases — separate from live cases)

CREATE TABLE public.curriculum_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  case_text text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  expected_insights text[] NOT NULL DEFAULT '{}',
  ai_answer text NOT NULL DEFAULT '',
  historical_answer text NOT NULL DEFAULT '',
  senior_reasoning text NOT NULL DEFAULT '',
  difficulty int NOT NULL DEFAULT 1,
  era text,
  industry text,
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.curriculum_progress (
  analyst_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.curriculum_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyst_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.curriculum_cases(id) ON DELETE CASCADE,
  analyst_level int NOT NULL DEFAULT 1,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  written_insight text NOT NULL DEFAULT '',
  per_question_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  accuracy_score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculum_attempts_analyst ON public.curriculum_attempts(analyst_id, created_at DESC);

ALTER TABLE public.curriculum_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_curriculum_cases" ON public.curriculum_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_curriculum_progress" ON public.curriculum_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_curriculum_attempts" ON public.curriculum_attempts FOR ALL USING (true) WITH CHECK (true);
