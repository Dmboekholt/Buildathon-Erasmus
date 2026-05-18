-- Add case_id to debriefs to tie a debrief to a case
ALTER TABLE public.debriefs
  ADD COLUMN IF NOT EXISTS case_id uuid;

ALTER TABLE public.debriefs
  ALTER COLUMN task_id DROP NOT NULL;

-- Create improvements table
CREATE TABLE IF NOT EXISTS public.improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'open',
  source_debrief_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_improvements" ON public.improvements
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER improvements_touch_updated_at
  BEFORE UPDATE ON public.improvements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed with current hardcoded items
INSERT INTO public.improvements (title, area, category, priority) VALUES
  ('Tighten revenue bridge assumptions', 'Financial analysis', 'Judgement', 'High'),
  ('Probe management succession risk', 'Governance', 'Decision Making', 'Medium'),
  ('Benchmark margin vs peer set', 'Market analysis', 'Insights', 'Medium'),
  ('Expand downside scenario modelling', 'Risk', 'Judgement', 'Low'),
  ('Document conviction triggers', 'Process', 'Decision Making', 'High'),
  ('Map customer concentration shifts', 'Market analysis', 'Insights', 'Low');