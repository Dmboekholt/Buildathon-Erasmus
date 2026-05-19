-- Demo roster alignment: canonical UUIDs, three cases, per-junior assignees

-- Ensure canonical roster (idempotent)
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
ON CONFLICT (id) DO UPDATE SET manager_id = EXCLUDED.manager_id;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Priya: Northgate carve-out
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
  $json${
    "investment_highlights_as_written": [
      "Division generates £84m revenue with 19% EBITDA margin post-allocation adjustments.",
      "Long-tenure OEM customers represent 71% of revenue with weighted average contract life of 4.2 years.",
      "Pro forma stand-alone SG&A reduction of £6.2m achievable within 18 months of separation.",
      "Inventory fair-value step-up of £11m requires careful purchase-price allocation and working-capital peg."
    ],
    "company_profile": {
      "description": "Northgate manufactures precision fasteners and sub-assemblies for automotive and industrial OEMs. Operations span two UK plants with centralized quality labs and a shared group ERP until carve-out.",
      "divisions": [
        { "name": "Automotive OEM", "fy2024_revenue_share": "58%" },
        { "name": "Industrial aftermarket", "fy2024_revenue_share": "42%" }
      ]
    },
    "financials": {
      "currency": "GBP millions",
      "historical": [
        { "fy": "FY2022", "revenue": 76.1, "ebitda": 13.2, "ebitda_margin": "17.3%" },
        { "fy": "FY2023", "revenue": 80.4, "ebitda": 14.8, "ebitda_margin": "18.4%" },
        { "fy": "FY2024", "revenue": 84.0, "ebitda": 15.9, "ebitda_margin": "18.9%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "Carve-out",
        "claim": "Transitional service agreements can be exited within 24 months without revenue disruption.",
        "analyst_rationale_as_written": "IT and finance TSAs priced at arm's length; management has parallel runbook for ERP migration tested in Q3 2024."
      },
      {
        "id": "d2",
        "section": "Accounting",
        "claim": "Inventory step-up amortization should be modelled over 3 years, not 5.",
        "analyst_rationale_as_written": "SKU turnover analysis shows 78% of affected inventory cycles within 36 months."
      },
      {
        "id": "d3",
        "section": "Working Capital",
        "claim": "Normalized NWC peg of 14.5% of revenue is appropriate for the closing accounts.",
        "analyst_rationale_as_written": "Twelve-month average ex-seasonality; excludes one-off receivable from parent reallocation."
      }
    ],
    "management": {
      "summary": "Division MD (12 years with group) and CFO-on-loan from parent until hire confirmed. Key finance hires targeted for close."
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
  assignee_id = EXCLUDED.assignee_id,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Tom: Meridian SaaS growth equity
INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Meridian SaaS growth equity',
  'Meridian Analytics Inc',
  'B2B vertical SaaS',
  'Minority growth investment in a workflow analytics platform for mid-market insurers; emphasis on NRR, cohort payback, and competitive moat.',
  'in_review',
  'high',
  '33333333-3333-3333-3333-333333333333',
  $json${
    "investment_highlights_as_written": [
      "ARR of $48m growing 42% YoY with net revenue retention of 118%.",
      "Gross margin of 81% with CAC payback under 14 months on 2024 cohorts.",
      "Land-and-expand motion: 34% of customers adopted second module within 12 months.",
      "Competitive set fragmented; Meridian holds #2 share in UK commercial lines niche."
    ],
    "company_profile": {
      "description": "Meridian provides claims and underwriting workflow software to regional insurers and MGAs. Product-led growth with inside sales and solutions engineering for enterprise tiers.",
      "divisions": [
        { "name": "Subscription ARR", "fy2024_revenue_share": "92%" },
        { "name": "Professional services", "fy2024_revenue_share": "8%" }
      ]
    },
    "financials": {
      "currency": "USD millions",
      "historical": [
        { "fy": "FY2022", "revenue": 24.1, "ebitda": -3.2, "ebitda_margin": "n/m" },
        { "fy": "FY2023", "revenue": 34.6, "ebitda": -1.1, "ebitda_margin": "n/m" },
        { "fy": "FY2024", "revenue": 48.2, "ebitda": 2.4, "ebitda_margin": "5.0%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "Market",
        "claim": "TAM expansion into EU mid-market adds $120m serviceable opportunity by 2028.",
        "analyst_rationale_as_written": "Regulatory reporting harmonization reduces localization cost; pilot in Benelux at 110% of UK ACV."
      },
      {
        "id": "d2",
        "section": "Unit Economics",
        "claim": "Rule-of-40 profile sustainable at current sales efficiency.",
        "analyst_rationale_as_written": "Growth plus FCF margin exceeds 40% in base case without assuming S&M leverage beyond historical."
      },
      {
        "id": "d3",
        "section": "Competition",
        "claim": "Incumbent suite providers pose limited near-term displacement risk.",
        "analyst_rationale_as_written": "Win-loss data shows 70% wins on time-to-value; losses concentrated in tier-1 accounts outside ICP."
      }
    ],
    "management": {
      "summary": "Founder-CEO (ex-insurer) and CRO hired 2023 from scale-up competitor. Engineering led by co-founder CTO."
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
  assignee_id = EXCLUDED.assignee_id,
  metadata = EXCLUDED.metadata,
  updated_at = now();

UPDATE public.cases SET assignee_id = '11111111-1111-1111-1111-111111111111'
  WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Per-junior improvements (idempotent titles per junior)
INSERT INTO public.improvements (junior_id, title, area, category, priority) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Reconcile inventory step-up', 'Accounting', 'Judgement', 'Medium'),
  ('22222222-2222-2222-2222-222222222222', 'Validate TSA exit cost build', 'Carve-out', 'Decision Making', 'High'),
  ('22222222-2222-2222-2222-222222222222', 'Document NWC peg methodology', 'Working capital', 'Insights', 'Medium'),
  ('33333333-3333-3333-3333-333333333333', 'Stress-test market sizing', 'Strategy', 'Insights', 'High'),
  ('33333333-3333-3333-3333-333333333333', 'Triangulate NRR cohort data', 'Unit economics', 'Judgement', 'Medium'),
  ('33333333-3333-3333-3333-333333333333', 'Map competitive win-loss themes', 'Market', 'Decision Making', 'Low');
