-- Judgment Ledger — canonical schema (no legacy BDO tasks/artifacts)

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'junior' CHECK (role IN ('junior', 'manager')),
  sector text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text,
  industry text,
  summary text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'junior')),
  PRIMARY KEY (project_id, profile_id)
);

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, profile_id)
);

CREATE TABLE public.debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  junior_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  transcript text,
  elevenlabs_conversation_id text,
  evaluation_json jsonb,
  improvement_items jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  junior_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  area text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'open',
  source_debrief_id uuid REFERENCES public.debriefs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debrief_id uuid REFERENCES public.debriefs(id) ON DELETE SET NULL,
  junior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  scored_at timestamptz NOT NULL DEFAULT now(),
  overall_score numeric(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  decision_making_score numeric(3,1) NOT NULL CHECK (decision_making_score >= 0 AND decision_making_score <= 10),
  insights_score numeric(3,1) NOT NULL CHECK (insights_score >= 0 AND insights_score <= 10),
  judgement_score numeric(3,1) NOT NULL CHECK (judgement_score >= 0 AND judgement_score <= 10),
  rubric_version text NOT NULL DEFAULT '1'
);

CREATE TRIGGER cases_touch_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER improvements_touch_updated_at
  BEFORE UPDATE ON public.improvements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX idx_debriefs_junior ON public.debriefs(junior_id);
CREATE INDEX idx_improvements_junior ON public.improvements(junior_id);
CREATE INDEX idx_score_snapshots_junior ON public.score_snapshots(junior_id, scored_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_cases" ON public.cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_project_members" ON public.project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_debriefs" ON public.debriefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_improvements" ON public.improvements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_score_snapshots" ON public.score_snapshots FOR ALL USING (true) WITH CHECK (true);
