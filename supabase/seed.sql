-- Demo people (UUIDs match WorkspaceSwitcher in the app)
INSERT INTO public.profiles (id, full_name, phone, role, sector, junior_year) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sam Patel', NULL, 'junior', 'Valuation', 1),
  ('22222222-2222-2222-2222-222222222222', 'Priya Sharma', NULL, 'junior', 'Accounting', 2),
  ('33333333-3333-3333-3333-333333333333', 'Tom Okonkwo', NULL, 'junior', 'Strategy', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alex Chen', NULL, 'manager', 'Valuation'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jordan Lee', NULL, 'manager', 'Strategy')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  sector = EXCLUDED.sector,
  junior_year = EXCLUDED.junior_year;

INSERT INTO public.projects (id, name, sector) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Project Alpha', 'Valuation'),
  ('b2222222-2222-2222-2222-222222222222', 'Project Beta', 'Accounting'),
  ('b3333333-3333-3333-3333-333333333333', 'Project Gamma', 'Strategy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_members (project_id, profile_id, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'),
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'junior'),
  ('b2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'junior'),
  ('b3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager'),
  ('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'junior')
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (id, name, manager_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Valuation pod', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e2222222-2222-2222-2222-222222222222', 'Strategy pod', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, manager_id = EXCLUDED.manager_id;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

INSERT INTO public.improvements (junior_id, title, area, category, priority) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tighten revenue bridge assumptions', 'Financial analysis', 'Judgement', 'High'),
  ('11111111-1111-1111-1111-111111111111', 'Probe management succession risk', 'Governance', 'Decision Making', 'Medium'),
  ('11111111-1111-1111-1111-111111111111', 'Benchmark margin vs peer set', 'Market analysis', 'Insights', 'Medium'),
  ('11111111-1111-1111-1111-111111111111', 'Expand downside scenario modelling', 'Risk', 'Judgement', 'Low'),
  ('11111111-1111-1111-1111-111111111111', 'Document conviction triggers', 'Process', 'Decision Making', 'High'),
  ('11111111-1111-1111-1111-111111111111', 'Map customer concentration shifts', 'Market analysis', 'Insights', 'Low'),
  ('22222222-2222-2222-2222-222222222222', 'Reconcile inventory step-up', 'Accounting', 'Judgement', 'Medium'),
  ('22222222-2222-2222-2222-222222222222', 'Validate TSA exit cost build', 'Carve-out', 'Decision Making', 'High'),
  ('22222222-2222-2222-2222-222222222222', 'Document NWC peg methodology', 'Working capital', 'Insights', 'Medium'),
  ('33333333-3333-3333-3333-333333333333', 'Stress-test market sizing', 'Strategy', 'Insights', 'High'),
  ('33333333-3333-3333-3333-333333333333', 'Triangulate NRR cohort data', 'Unit economics', 'Judgement', 'Medium'),
  ('33333333-3333-3333-3333-333333333333', 'Map competitive win-loss themes', 'Market', 'Decision Making', 'Low');

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

-- Six cases, two per junior (Thermanova seeded in bootstrap / migration)
INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Northgate carve-out diligence',
  'Northgate Components Ltd',
  'Industrial components',
  'Carve-out of the precision fasteners division from a diversified industrial group; focus on stand-alone cost base and TSAs.',
  'in_review',
  'medium',
  '22222222-2222-2222-2222-222222222222',
  '{"investment_highlights_as_written":["Division generates £84m revenue with 19% EBITDA margin post-allocation adjustments.","Pro forma stand-alone SG&A reduction of £6.2m achievable within 18 months of separation."],"company_profile":{"description":"Northgate manufactures precision fasteners for automotive and industrial OEMs.","divisions":[{"name":"Automotive OEM","fy2024_revenue_share":"58%"},{"name":"Industrial aftermarket","fy2024_revenue_share":"42%"}]},"financials":{"currency":"GBP millions","historical":[{"fy":"FY2024","revenue":84.0,"ebitda":15.9,"ebitda_margin":"18.9%"}]},"decisions":[{"id":"d1","section":"Carve-out","claim":"TSAs can be exited within 24 months without revenue disruption.","analyst_rationale_as_written":"ERP migration runbook tested in Q3 2024."},{"id":"d2","section":"Accounting","claim":"Inventory step-up amortization should be modelled over 3 years.","analyst_rationale_as_written":"78% of affected inventory cycles within 36 months."}],"management":{"summary":"Division MD (12 years) leading separation workstream."}}'::jsonb
),
(
  'a3333333-3333-3333-3333-333333333333',
  'Meridian SaaS growth equity',
  'Meridian Analytics Inc',
  'B2B vertical SaaS',
  'Minority growth investment in a workflow analytics platform for mid-market insurers; emphasis on NRR, cohort payback, and competitive moat.',
  'in_review',
  'high',
  '33333333-3333-3333-3333-333333333333',
  '{"investment_highlights_as_written":["ARR of $48m growing 42% YoY with net revenue retention of 118%.","Gross margin of 81% with CAC payback under 14 months on 2024 cohorts."],"company_profile":{"description":"Meridian provides claims and underwriting workflow software to regional insurers.","divisions":[{"name":"Subscription ARR","fy2024_revenue_share":"92%"},{"name":"Professional services","fy2024_revenue_share":"8%"}]},"financials":{"currency":"USD millions","historical":[{"fy":"FY2024","revenue":48.2,"ebitda":2.4,"ebitda_margin":"5.0%"}]},"decisions":[{"id":"d1","section":"Market","claim":"EU mid-market adds $120m serviceable opportunity by 2028.","analyst_rationale_as_written":"Benelux pilot at 110% of UK ACV."},{"id":"d2","section":"Unit Economics","claim":"Rule-of-40 profile sustainable at current sales efficiency.","analyst_rationale_as_written":"Growth plus FCF margin exceeds 40% in base case."}],"management":{"summary":"Founder-CEO and CRO hired 2023 from scale-up competitor."}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  assignee_id = EXCLUDED.assignee_id,
  metadata = EXCLUDED.metadata,
  updated_at = now();

UPDATE public.cases SET assignee_id = '11111111-1111-1111-1111-111111111111'
  WHERE id = 'a1111111-1111-1111-1111-111111111111';

INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES
(
  'a1111112-1111-1111-1111-111111111112',
  'Ferroline industrial rollup',
  'Ferroline Holdings AG',
  'Industrial distribution',
  'Buy-and-build platform in specialty metals distribution across DACH; focus on synergy phasing, leverage path, and integration of the latest bolt-on.',
  'open',
  'medium',
  '11111111-1111-1111-1111-111111111111',
  '{"investment_highlights_as_written":["Pro forma revenue of €312m with 11.4% EBITDA margin after the SteelCo bolt-on.","Net leverage of 4.1x at close trending to 3.0x by year three under base EBITDA growth."],"company_profile":{"description":"Ferroline distributes specialty steel, alloys, and processing services to automotive tier-2 and general industrial customers.","divisions":[{"name":"Distribution","fy2024_revenue_share":"76%"},{"name":"Processing & cut-to-length","fy2024_revenue_share":"24%"}]},"financials":{"currency":"EUR millions","historical":[{"fy":"FY2024","revenue":312.0,"ebitda":35.6,"ebitda_margin":"11.4%"}]},"decisions":[{"id":"d1","section":"Synergies","claim":"SteelCo procurement synergies of €4.2m are achievable within 12 months post-close.","analyst_rationale_as_written":"Overlap on top-20 SKUs is 62%."}],"management":{"summary":"CEO led two prior PE-backed rollups; CFO appointed 2022 from listed peer."}}'::jsonb
),
(
  'a2222223-2222-2222-2222-222222222223',
  'Harborview QoE and NWC',
  'Harborview Packaging plc',
  'Consumer packaging',
  'Quality of earnings and net working capital review ahead of a take-private; emphasis on normalized EBITDA, customer rebates, and closing accounts peg.',
  'open',
  'high',
  '22222222-2222-2222-2222-222222222222',
  '{"investment_highlights_as_written":["Reported FY2024 EBITDA of £41m; normalized QoE EBITDA of £38.2m after rebate adjustments.","Trade working capital averaged 11.8% of revenue; proposed peg of 12.0% within market range."],"company_profile":{"description":"Harborview manufactures flexible packaging for food and household brands in the UK and Ireland.","divisions":[{"name":"Food","fy2024_revenue_share":"64%"},{"name":"Household","fy2024_revenue_share":"36%"}]},"financials":{"currency":"GBP millions","historical":[{"fy":"FY2024","revenue":325.8,"ebitda":41.0,"ebitda_margin":"12.6%"}]},"decisions":[{"id":"d1","section":"QoE","claim":"£2.8m of customer rebates should be excluded from normalized EBITDA.","analyst_rationale_as_written":"Rebates tied to volume tiers not accrued consistently in H2 FY2024."}],"management":{"summary":"CEO and group FD supported by Big Four audit."}}'::jsonb
),
(
  'a3333334-3333-3333-3333-333333333334',
  'Vantage marketplace expansion',
  'Vantage Commerce Ltd',
  'B2B marketplace',
  'Strategic review of geographic expansion and category adjacencies for a vertical marketplace connecting SME suppliers to mid-market buyers.',
  'open',
  'medium',
  '33333333-3333-3333-3333-333333333333',
  '{"investment_highlights_as_written":["GMV of £186m growing 28% YoY with take rate stable at 11.2%.","Nordics pilot GMV run-rate 15% above plan with supplier NPS of 62."],"company_profile":{"description":"Vantage operates a curated marketplace for industrial MRO and safety supplies.","divisions":[{"name":"Marketplace fees","fy2024_revenue_share":"78%"},{"name":"Supplier SaaS","fy2024_revenue_share":"22%"}]},"financials":{"currency":"GBP millions","historical":[{"fy":"FY2024","revenue":20.8,"ebitda":1.2,"ebitda_margin":"5.8%"}]},"decisions":[{"id":"d1","section":"Market","claim":"Nordics expansion adds £45m addressable GMV by FY2027.","analyst_rationale_as_written":"Supplier density in pilot markets reached liquidity threshold early."}],"management":{"summary":"CEO co-founded marketplace in 2018; CPO from leading e-commerce platform joined 2023."}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  assignee_id = EXCLUDED.assignee_id,
  metadata = EXCLUDED.metadata,
  updated_at = now();

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
  '',
  'The deterioration likely reflects slower collections on receivables as DSO stretched from 48 to 62 days, plus inventory build as turns fell from 6.2x to 4.8x. Revenue growth without cash conversion points to working capital absorption rather than underlying demand collapse.',
  'Always tie DSO and inventory moves to operational drivers before blaming seasonality. Ask whether receivables aging shifted at month-end and whether inventory is finished goods vs raw materials.'
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
  '',
  'Revenue-side: customer mix shifted toward lower-margin channels or promotional pricing eroded realized price. Cost-side: integration costs or duplicate overhead offset procurement synergies that were ahead of plan.',
  'When procurement synergies beat plan but gross margin misses, the story is rarely procurement alone. Split revenue bridge (volume, price, mix) from cost bridge (COGS, stranded costs, integration).'
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Recurring revenue mix',
  'A commercial HVAC platform grew revenue 12% but EBITDA margin fell 80 bps. Management attributes the miss to installation mix shifting toward lower-margin projects while maintenance contract revenue grew only 4%.',
  $q$[
    {"id": "q1", "prompt": "What would you check first in the revenue bridge?", "guidance": "Separate recurring vs project revenue."},
    {"id": "q2", "prompt": "What risk does the installation mix shift pose to forward cash flow?", "guidance": "Link margin mix to contract backlog and renewals."}
  ]$q$::jsonb,
  ARRAY['service', 'recurring', 'installation', 'margin', 'mix', 'backlog', 'maintenance', 'contract'],
  2,
  '2019',
  'HVAC services',
  'Deal archive',
  '',
  'Past analysts split installation vs maintenance in the bridge and flagged that installation growth without proportional service attach dilutes margin. They checked backlog conversion and whether new installs carried multi-year service riders.',
  'Seniors focus on contract renewal rates and gross profit per technician hour, not headline revenue growth. A 12% top-line with weak service growth usually means the model is drifting toward project work.'
),
(
  'c4444444-4444-4444-4444-444444444444',
  'Carve-out stand-alone costs',
  'A precision components division is being carved out from a diversified industrial group. Pro forma SG&A savings are modeled at £6.2m, but IT and finance transitional service agreements run 24 months at arm''s length rates. Inventory fair-value step-up of £11m is under debate.',
  $q$[
    {"id": "q1", "prompt": "What are the two biggest risks to the stand-alone cost case?", "guidance": "Think TSAs and one-off vs recurring."},
    {"id": "q2", "prompt": "How would you approach the inventory step-up amortization period?", "guidance": "Use turnover and SKU data if possible."}
  ]$q$::jsonb,
  ARRAY['TSA', 'carve-out', 'inventory', 'step-up', 'SG&A', 'standalone', 'ERP', 'amortization'],
  3,
  '2021',
  'Industrial carve-out',
  'Deal archive',
  '',
  'Past analysts stressed TSA exit timing and parallel-run ERP costs as the main risks to SG&A savings. On inventory, they used SKU turnover to argue for a 3-year amortization window rather than 5, since most affected stock cycled within 36 months.',
  'Do not take management''s synergy deck at face value until TSAs are priced and staffed. Inventory step-up is a purchase-price allocation issue—anchor amortization to physical turnover, not accounting convenience.'
),
(
  'c5555555-5555-5555-5555-555555555555',
  'SaaS cohort quality',
  'A B2B workflow analytics platform reports ARR of $48m growing 42% YoY with net revenue retention of 118%. Sales and marketing spend rose 55% while CAC payback on 2024 cohorts is quoted at 14 months. Management claims a sustainable Rule-of-40 profile.',
  $q$[
    {"id": "q1", "prompt": "What metrics would you stress-test to validate cohort quality?", "guidance": "NRR, churn, and payback."},
    {"id": "q2", "prompt": "What competitive risk could undermine the growth narrative?", "guidance": "Be specific to enterprise vs mid-market."}
  ]$q$::jsonb,
  ARRAY['NRR', 'churn', 'CAC', 'payback', 'cohort', 'ARR', 'expansion', 'competition', 'retention'],
  3,
  '2023',
  'B2B SaaS',
  'Deal archive',
  '',
  'Past analysts triangulated NRR by vintage cohort, checked gross churn vs expansion revenue, and reconciled CAC payback to actual S&M per net new ARR dollar. They noted win-loss concentration in tier-1 accounts outside the ICP as the main competitive threat.',
  'Rule-of-40 is only credible if S&M efficiency is not bought with deteriorating cohort economics. Always ask for logo churn and expansion by cohort year, not blended NRR alone.'
)
ON CONFLICT (id) DO NOTHING;
