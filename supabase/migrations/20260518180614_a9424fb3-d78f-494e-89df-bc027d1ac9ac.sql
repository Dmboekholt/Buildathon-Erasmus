-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'junior',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Artifacts
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debriefs
CREATE TABLE public.debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  questions_json JSONB,
  elevenlabs_conversation_id TEXT,
  transcript TEXT,
  evaluation_json JSONB,
  improvement_items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;

-- Demo: permissive policies (no auth in MVP)
CREATE POLICY "demo_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_tasks"    ON public.tasks    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_artifacts" ON public.artifacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_debriefs" ON public.debriefs FOR ALL USING (true) WITH CHECK (true);

-- Seed demo junior + tasks
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'Sam Patel', '+447000000000', 'junior');

INSERT INTO public.tasks (assignee_id, title, description, status, due_at) VALUES
('11111111-1111-1111-1111-111111111111',
 'Revenue forecast — Acme Ltd Q3',
 'Build a three-scenario revenue forecast for Acme Ltd Q3. Pick a base, upside, and downside growth assumption and justify each. Flag any client-specific risks that should be reflected in the model.',
 'assigned', now() + interval '5 days'),
('11111111-1111-1111-1111-111111111111',
 'Materiality calculation — Bramble Audit',
 'Propose an overall materiality and performance materiality for Bramble Plc. Choose your benchmark and percentage, and explain why this client warrants that approach.',
 'assigned', now() + interval '3 days'),
('11111111-1111-1111-1111-111111111111',
 'Risk-weighted client onboarding memo',
 'Draft a one-page risk assessment for a new SME client in the food import sector. Identify the top three risks and recommend a risk rating with reasoning.',
 'assigned', now() + interval '7 days'),
('11111111-1111-1111-1111-111111111111',
 'Working capital review — Northwind',
 'Review the trial balance and propose two working capital improvements. Quantify the expected impact and explain trade-offs for the client.',
 'assigned', now() + interval '4 days');

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('task-artifacts', 'task-artifacts', false);

CREATE POLICY "demo_artifacts_read" ON storage.objects FOR SELECT USING (bucket_id = 'task-artifacts');
CREATE POLICY "demo_artifacts_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-artifacts');
CREATE POLICY "demo_artifacts_update" ON storage.objects FOR UPDATE USING (bucket_id = 'task-artifacts');