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
