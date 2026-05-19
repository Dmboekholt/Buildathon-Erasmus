-- BDO Insight bootstrap
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

-- Demo investment case with full memorandum metadata for case detail UI
INSERT INTO public.cases (
  id,
  title,
  company,
  industry,
  summary,
  status,
  priority,
  metadata
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Thermanova acquisition',
  'Thermanova GmbH',
  'Industrial heating & climate',
  'Platform acquisition of a European leader in commercial HVAC with recurring service revenue and bolt-on M&A runway.',
  'in_review',
  'high',
  $json${
    "investment_highlights_as_written": [
      "Leading share in DACH commercial HVAC service with 18% organic revenue CAGR (FY2020–FY2024).",
      "Recurring maintenance contracts represent 62% of gross profit and support resilient cash conversion.",
      "Management has executed four tuck-in acquisitions since 2021 with synergy capture ahead of plan.",
      "Entry at 9.2x FY2024 EBITDA implies mid-teens IRR under base case with deleveraging from 3.8x to 2.5x Net Debt / EBITDA by year three."
    ],
    "company_profile": {
      "description": "Thermanova designs, installs, and maintains commercial heating, ventilation, and climate systems for mid-market industrial and logistics customers. The group operates through a hub-and-spoke service network with centralized procurement and field technicians on long-term service contracts.",
      "divisions": [
        { "name": "Installation", "fy2024_revenue_share": "34%" },
        { "name": "Maintenance & service", "fy2024_revenue_share": "48%" },
        { "name": "Retrofit & energy upgrades", "fy2024_revenue_share": "18%" }
      ]
    },
    "financials": {
      "currency": "EUR millions",
      "historical": [
        { "fy": "FY2022", "revenue": 142.3, "ebitda": 21.8, "ebitda_margin": "15.3%" },
        { "fy": "FY2023", "revenue": 158.7, "ebitda": 25.4, "ebitda_margin": "16.0%" },
        { "fy": "FY2024", "revenue": 171.2, "ebitda": 28.1, "ebitda_margin": "16.4%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "Forecast",
        "claim": "Base revenue growth of 7% through FY2027 is achievable given backlog and pricing pass-through.",
        "analyst_rationale_as_written": "Backlog coverage is 11 months; prior two years averaged 6.8% organic growth with limited churn on service contracts."
      },
      {
        "id": "d2",
        "section": "Market",
        "claim": "Regulatory push for heat-pump retrofits expands addressable market by ~25% in core regions.",
        "analyst_rationale_as_written": "EU building directive timelines align with management capex plan; competitor capacity remains constrained."
      },
      {
        "id": "d3",
        "section": "Growth Strategy",
        "claim": "Buy-and-build can add 40–60 bps EBITDA margin annually if integration playbook is replicated.",
        "analyst_rationale_as_written": "Last three deals achieved 120% of targeted cost synergies within 14 months."
      },
      {
        "id": "d4",
        "section": "Risks",
        "claim": "Skilled technician shortage is the primary operational risk but mitigated by in-house academy.",
        "analyst_rationale_as_written": "Attrition fell to 9% in FY2024 vs 14% sector benchmark; apprenticeship intake doubled."
      },
      {
        "id": "d5",
        "section": "Valuation",
        "claim": "9.2x FY2024 EBITDA is in line with precedent transactions for service-heavy HVAC platforms.",
        "analyst_rationale_as_written": "Comps range 8.5x–10.5x; premium justified by contract mix and integration track record."
      }
    ],
    "management": {
      "summary": "CEO (founder, 22 years) and CFO (ex-industrial PE) have partnered since 2019. COO leads field operations; no key-person gaps identified in diligence. Succession plan documented for CEO role with 24-month horizon."
    }
  }$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  company = EXCLUDED.company,
  industry = EXCLUDED.industry,
  summary = EXCLUDED.summary,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Demo people (UUIDs match WorkspaceSwitcher in the app)
INSERT INTO public.profiles (id, full_name, phone, role, sector) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sam Patel', NULL, 'junior', 'Valuation'),
  ('22222222-2222-2222-2222-222222222222', 'Priya Sharma', NULL, 'junior', 'Accounting'),
  ('33333333-3333-3333-3333-333333333333', 'Tom Okonkwo', NULL, 'junior', 'Strategy'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alex Chen', NULL, 'manager', 'Valuation'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jordan Lee', NULL, 'manager', 'Strategy')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  sector = EXCLUDED.sector;

INSERT INTO public.projects (id, name, sector) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Project Alpha', 'Valuation'),
  ('b2222222-2222-2222-2222-222222222222', 'Project Beta', 'Accounting'),
  ('b3333333-3333-3333-3333-333333333333', 'Project Gamma', 'Strategy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_members (project_id, profile_id, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'),
  ('b1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager'),
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'junior'),
  ('b2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'junior'),
  ('b3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager'),
  ('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'junior')
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (id, name, manager_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Valuation pod', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO public.improvements (junior_id, title, area, category, priority) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tighten revenue bridge assumptions', 'Financial analysis', 'Judgement', 'High'),
  ('11111111-1111-1111-1111-111111111111', 'Probe management succession risk', 'Governance', 'Decision Making', 'Medium'),
  ('11111111-1111-1111-1111-111111111111', 'Benchmark margin vs peer set', 'Market analysis', 'Insights', 'Medium'),
  ('11111111-1111-1111-1111-111111111111', 'Expand downside scenario modelling', 'Risk', 'Judgement', 'Low'),
  ('11111111-1111-1111-1111-111111111111', 'Document conviction triggers', 'Process', 'Decision Making', 'High'),
  ('11111111-1111-1111-1111-111111111111', 'Map customer concentration shifts', 'Market analysis', 'Insights', 'Low'),
  ('22222222-2222-2222-2222-222222222222', 'Reconcile inventory step-up', 'Accounting', 'Judgement', 'Medium'),
  ('33333333-3333-3333-3333-333333333333', 'Stress-test market sizing', 'Strategy', 'Insights', 'High');

INSERT INTO public.score_snapshots (
  id, junior_id, project_id, scored_at,
  overall_score, decision_making_score, insights_score, judgement_score, rubric_version
) VALUES
  ('d1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() - interval '56 days', 5.5, 5.0, 6.0, 5.5, '1'),
  ('d1000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() - interval '42 days', 6.0, 5.5, 6.5, 6.0, '1'),
  ('d1000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() - interval '28 days', 6.5, 6.0, 7.0, 6.5, '1'),
  ('d1000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() - interval '14 days', 7.0, 6.5, 7.5, 7.0, '1'),
  ('d1000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() - interval '3 days', 7.5, 7.0, 8.0, 7.5, '1'),
  ('d2000002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', now() - interval '49 days', 4.5, 4.0, 5.0, 4.5, '1'),
  ('d2000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', now() - interval '35 days', 5.0, 4.5, 5.5, 5.0, '1'),
  ('d3000003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', now() - interval '45 days', 6.0, 6.5, 5.5, 6.0, '1'),
  ('d3000003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', now() - interval '15 days', 7.0, 7.5, 6.5, 7.0, '1')
ON CONFLICT (id) DO NOTHING;

UPDATE public.cases
SET assignee_id = '11111111-1111-1111-1111-111111111111'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

INSERT INTO public.curriculum_progress (analyst_id, level) VALUES
  ('11111111-1111-1111-1111-111111111111', 1),
  ('22222222-2222-2222-2222-222222222222', 1),
  ('33333333-3333-3333-3333-333333333333', 1)
ON CONFLICT (analyst_id) DO NOTHING;

INSERT INTO public.curriculum_cases (
  id, title, case_text, questions, expected_insights, difficulty, era, industry, source,
  ai_answer, historical_answer, senior_reasoning
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'Working capital bridge',
  'A mid-cap industrial distributor reported DSO rising from 48 to 62 days while inventory turns fell from 6.2x to 4.8x. Revenue grew 9% but operating cash flow declined year over year.',
  $q$[
    {"id": "q1", "prompt": "What are the two most likely drivers of the cash flow deterioration?", "guidance": "Link receivables and inventory to operations."},
    {"id": "q2", "prompt": "What follow-up questions would you ask management?", "guidance": "Be specific to trade working capital."}
  ]$q$::jsonb,
  ARRAY['receivables', 'inventory', 'DSO', 'collections', 'channel stuffing', 'demand'],
  1,
  'Current',
  'Industrial distribution',
  'Training library',
  '', '', ''
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Margin compression post-merger',
  'Two years after a horizontal merger, gross margin is down 180 bps versus the pro forma plan, while synergy capture on procurement was ahead of target.',
  $q$[
    {"id": "q1", "prompt": "Name one revenue-side and one cost-side hypothesis for the margin miss.", "guidance": "Avoid generic answers."}
  ]$q$::jsonb,
  ARRAY['mix', 'pricing', 'synergy', 'integration', 'procurement', 'discounting'],
  2,
  'Historical',
  'Consumer staples',
  'Training library',
  '', '', ''
)
ON CONFLICT (id) DO NOTHING;
