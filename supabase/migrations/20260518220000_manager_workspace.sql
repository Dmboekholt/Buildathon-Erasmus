-- Manager workspace: projects, teams, score snapshots

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sector text;

-- Projects (engagements; not the same as sector line)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'junior')),
  PRIMARY KEY (project_id, profile_id)
);

-- Teams (pods); separate from sector
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, profile_id)
);

ALTER TABLE public.debriefs
  ADD COLUMN IF NOT EXISTS junior_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.improvements
  ADD COLUMN IF NOT EXISTS junior_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.score_snapshots (
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_all_projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_project_members" ON public.project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo_all_score_snapshots" ON public.score_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Managers
INSERT INTO public.profiles (id, full_name, phone, role, sector) VALUES
  ('m1111111-1111-1111-1111-111111111111', 'Alex Chen', NULL, 'manager', 'Valuation'),
  ('m2222222-2222-2222-2222-222222222222', 'Jordan Lee', NULL, 'manager', 'Strategy')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, sector = EXCLUDED.sector;

-- Juniors (J1 = existing Sam Patel)
UPDATE public.profiles SET role = 'junior', sector = 'Valuation', full_name = 'Sam Patel'
  WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.profiles (id, full_name, phone, role, sector) VALUES
  ('j2222222-2222-2222-2222-222222222222', 'Priya Sharma', NULL, 'junior', 'Accounting'),
  ('j3333333-3333-3333-3333-333333333333', 'Tom Okonkwo', NULL, 'junior', 'Strategy')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, sector = EXCLUDED.sector;

-- Projects
INSERT INTO public.projects (id, name, sector) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'Project Alpha', 'Valuation'),
  ('p2222222-2222-2222-2222-222222222222', 'Project Beta', 'Accounting'),
  ('p3333333-3333-3333-3333-333333333333', 'Project Gamma', 'Strategy')
ON CONFLICT (id) DO NOTHING;

-- Project members: J1 with both managers on Alpha
INSERT INTO public.project_members (project_id, profile_id, role) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'manager'),
  ('p1111111-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 'manager'),
  ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'junior'),
  ('p2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'manager'),
  ('p2222222-2222-2222-2222-222222222222', 'j2222222-2222-2222-2222-222222222222', 'junior'),
  ('p3333333-3333-3333-3333-333333333333', 'm2222222-2222-2222-2222-222222222222', 'manager'),
  ('p3333333-3333-3333-3333-333333333333', 'j3333333-3333-3333-3333-333333333333', 'junior')
ON CONFLICT DO NOTHING;

-- Team: Alex leads Valuation pod, Priya member (team visibility for M1 -> J2)
INSERT INTO public.teams (id, name, manager_id) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'Valuation pod', 'm1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'j2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Link demo case to J1
UPDATE public.cases SET assignee_id = '11111111-1111-1111-1111-111111111111'
  WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Score history (synthetic, past 8 weeks)
INSERT INTO public.score_snapshots (
  id, junior_id, project_id, scored_at,
  overall_score, decision_making_score, insights_score, judgement_score, rubric_version
) VALUES
  ('s1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', now() - interval '56 days', 5.5, 5.0, 6.0, 5.5, '1'),
  ('s1000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', now() - interval '42 days', 6.0, 5.5, 6.5, 6.0, '1'),
  ('s1000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', now() - interval '28 days', 6.5, 6.0, 7.0, 6.5, '1'),
  ('s1000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', now() - interval '14 days', 7.0, 6.5, 7.5, 7.0, '1'),
  ('s1000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', now() - interval '3 days', 7.5, 7.0, 8.0, 7.5, '1'),
  ('s2000002-0000-0000-0000-000000000001', 'j2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', now() - interval '49 days', 4.5, 4.0, 5.0, 4.5, '1'),
  ('s2000002-0000-0000-0000-000000000002', 'j2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', now() - interval '35 days', 5.0, 4.5, 5.5, 5.0, '1'),
  ('s2000002-0000-0000-0000-000000000003', 'j2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', now() - interval '21 days', 5.5, 5.0, 6.0, 5.5, '1'),
  ('s2000002-0000-0000-0000-000000000004', 'j2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', now() - interval '7 days', 6.0, 5.5, 6.5, 6.0, '1'),
  ('s3000003-0000-0000-0000-000000000001', 'j3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', now() - interval '45 days', 6.0, 6.5, 5.5, 6.0, '1'),
  ('s3000003-0000-0000-0000-000000000002', 'j3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', now() - interval '30 days', 6.5, 7.0, 6.0, 6.5, '1'),
  ('s3000003-0000-0000-0000-000000000003', 'j3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', now() - interval '15 days', 7.0, 7.5, 6.5, 7.0, '1'),
  ('s3000003-0000-0000-0000-000000000004', 'j3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', now() - interval '2 days', 7.5, 8.0, 7.0, 7.5, '1')
ON CONFLICT (id) DO NOTHING;

-- Assign improvements to J1 for junior-scoped analytics demo
UPDATE public.improvements SET junior_id = '11111111-1111-1111-1111-111111111111'
  WHERE junior_id IS NULL;
