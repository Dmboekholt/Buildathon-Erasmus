-- Disjoint manager rosters + second case per junior (6 cases total)

-- Jordan no longer shares Project Alpha with Alex (removes Sam from Jordan's roster)
DELETE FROM public.project_members
WHERE project_id = 'b1111111-1111-1111-1111-111111111111'
  AND profile_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND role = 'manager';

-- Alex: Valuation pod — Sam + Priya
INSERT INTO public.teams (id, name, manager_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Valuation pod', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, manager_id = EXCLUDED.manager_id;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Jordan: Strategy pod — Tom
INSERT INTO public.teams (id, name, manager_id) VALUES
  ('e2222222-2222-2222-2222-222222222222', 'Strategy pod', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, manager_id = EXCLUDED.manager_id;

INSERT INTO public.team_members (team_id, profile_id) VALUES
  ('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Sam: second case — industrial rollup / LBO
INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES (
  'a1111112-1111-1111-1111-111111111112',
  'Ferroline industrial rollup',
  'Ferroline Holdings AG',
  'Industrial distribution',
  'Buy-and-build platform in specialty metals distribution across DACH; focus on synergy phasing, leverage path, and integration of the latest bolt-on.',
  'open',
  'medium',
  '11111111-1111-1111-1111-111111111111',
  $json${
    "investment_highlights_as_written": [
      "Pro forma revenue of €312m with 11.4% EBITDA margin after the SteelCo bolt-on.",
      "Identified procurement synergies of €8–10m run-rate by FY2026 with 70% captured in prior integrations.",
      "Net leverage of 4.1x at close trending to 3.0x by year three under base EBITDA growth.",
      "Fragmented supplier base supports continued tuck-in pipeline at 6–8x pre-synergy EBITDA."
    ],
    "company_profile": {
      "description": "Ferroline distributes specialty steel, alloys, and processing services to automotive tier-2 and general industrial customers. The platform has completed five acquisitions since 2019 with a centralized commercial and logistics backbone.",
      "divisions": [
        { "name": "Distribution", "fy2024_revenue_share": "76%" },
        { "name": "Processing & cut-to-length", "fy2024_revenue_share": "24%" }
      ]
    },
    "financials": {
      "currency": "EUR millions",
      "historical": [
        { "fy": "FY2022", "revenue": 248.5, "ebitda": 26.1, "ebitda_margin": "10.5%" },
        { "fy": "FY2023", "revenue": 279.8, "ebitda": 30.4, "ebitda_margin": "10.9%" },
        { "fy": "FY2024", "revenue": 312.0, "ebitda": 35.6, "ebitda_margin": "11.4%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "Synergies",
        "claim": "SteelCo procurement synergies of €4.2m are achievable within 12 months post-close.",
        "analyst_rationale_as_written": "Overlap on top-20 SKUs is 62%; prior deals averaged 85% synergy capture in year one."
      },
      {
        "id": "d2",
        "section": "Leverage",
        "claim": "4.1x net leverage at close is appropriate given contracted EBITDA visibility.",
        "analyst_rationale_as_written": "82% of FY2024 EBITDA from accounts with tenure over five years; minimal customer concentration."
      },
      {
        "id": "d3",
        "section": "Valuation",
        "claim": "Entry multiple of 7.8x FY2024 pro forma EBITDA is justified versus comps.",
        "analyst_rationale_as_written": "Listed distributors trade 7.0x–9.0x; premium reflects synergy track record and platform systems."
      }
    ],
    "management": {
      "summary": "CEO led two prior PE-backed rollups; CFO appointed 2022 from listed peer. Integration office staffed with dedicated PMI lead."
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

-- Priya: second case — QoE / working capital
INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES (
  'a2222223-2222-2222-2222-222222222223',
  'Harborview QoE and NWC',
  'Harborview Packaging plc',
  'Consumer packaging',
  'Quality of earnings and net working capital review ahead of a take-private; emphasis on normalized EBITDA, customer rebates, and closing accounts peg.',
  'open',
  'high',
  '22222222-2222-2222-2222-222222222222',
  $json${
    "investment_highlights_as_written": [
      "Reported FY2024 EBITDA of £41m; normalized QoE EBITDA of £38.2m after rebate and one-off adjustments.",
      "Trade working capital averaged 11.8% of revenue; proposed peg of 12.0% within market range.",
      "Top-five customers represent 48% of revenue with stable contract renewals through 2026.",
      "Capex maintenance run-rate of £6.5m supports capacity utilization at 87%."
    ],
    "company_profile": {
      "description": "Harborview manufactures flexible packaging for food and household brands in the UK and Ireland. Operations include extrusion, printing, and converting across three sites with shared planning systems.",
      "divisions": [
        { "name": "Food", "fy2024_revenue_share": "64%" },
        { "name": "Household", "fy2024_revenue_share": "36%" }
      ]
    },
    "financials": {
      "currency": "GBP millions",
      "historical": [
        { "fy": "FY2022", "revenue": 298.0, "ebitda": 36.5, "ebitda_margin": "12.2%" },
        { "fy": "FY2023", "revenue": 312.4, "ebitda": 39.1, "ebitda_margin": "12.5%" },
        { "fy": "FY2024", "revenue": 325.8, "ebitda": 41.0, "ebitda_margin": "12.6%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "QoE",
        "claim": "£2.8m of customer rebates should be excluded from normalized EBITDA.",
        "analyst_rationale_as_written": "Rebates tied to volume tiers not accrued consistently in H2 FY2024; adjustment matches contract terms."
      },
      {
        "id": "d2",
        "section": "Working Capital",
        "claim": "12.0% NWC peg is appropriate for closing accounts.",
        "analyst_rationale_as_written": "Twelve-month average excluding December seasonality; aligns with peer packaging transactions."
      },
      {
        "id": "d3",
        "section": "Accounting",
        "claim": "Capitalized tooling costs of £1.1m should be expensed in normalized EBITDA.",
        "analyst_rationale_as_written": "Policy change in FY2024; peer set expenses similar costs through COGS."
      }
    ],
    "management": {
      "summary": "CEO (industry veteran) and group FD supported by Big Four audit; no material control deficiencies noted in data room."
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

-- Tom: second case — strategy / platform expansion
INSERT INTO public.cases (
  id, title, company, industry, summary, status, priority, assignee_id, metadata
) VALUES (
  'a3333334-3333-3333-3333-333333333334',
  'Vantage marketplace expansion',
  'Vantage Commerce Ltd',
  'B2B marketplace',
  'Strategic review of geographic expansion and category adjacencies for a vertical marketplace connecting SME suppliers to mid-market buyers.',
  'open',
  'medium',
  '33333333-3333-3333-3333-333333333333',
  $json${
    "investment_highlights_as_written": [
      "GMV of £186m growing 28% YoY with take rate stable at 11.2%.",
      "Nordics pilot GMV run-rate 15% above plan with supplier NPS of 62.",
      "Contribution margin positive in core UK geographies; new regions require 18-month investment.",
      "Network effects strengthening: repeat buyer rate 74% on trailing twelve months."
    ],
    "company_profile": {
      "description": "Vantage operates a curated marketplace for industrial MRO and safety supplies, monetizing through transaction fees and supplier SaaS tools. Product roadmap includes embedded financing and demand forecasting.",
      "divisions": [
        { "name": "Marketplace fees", "fy2024_revenue_share": "78%" },
        { "name": "Supplier SaaS", "fy2024_revenue_share": "22%" }
      ]
    },
    "financials": {
      "currency": "GBP millions",
      "historical": [
        { "fy": "FY2022", "revenue": 14.2, "ebitda": -2.1, "ebitda_margin": "n/m" },
        { "fy": "FY2023", "revenue": 17.8, "ebitda": -0.6, "ebitda_margin": "n/m" },
        { "fy": "FY2024", "revenue": 20.8, "ebitda": 1.2, "ebitda_margin": "5.8%" }
      ]
    },
    "decisions": [
      {
        "id": "d1",
        "section": "Market",
        "claim": "Nordics expansion adds £45m addressable GMV by FY2027.",
        "analyst_rationale_as_written": "Supplier density in pilot markets reached liquidity threshold two quarters ahead of model."
      },
      {
        "id": "d2",
        "section": "Competition",
        "claim": "Horizontal marketplaces pose limited threat in Vantage's core categories.",
        "analyst_rationale_as_written": "Win-loss interviews cite compliance catalog and lead-time reliability as differentiators."
      },
      {
        "id": "d3",
        "section": "Strategy",
        "claim": "Adjacent move into PPE is accretive without diluting take rate.",
        "analyst_rationale_as_written": "70% SKU overlap on existing supplier base; incremental CAC under 30% of core category."
      }
    ],
    "management": {
      "summary": "CEO co-founded marketplace in 2018; CPO from leading e-commerce platform joined 2023. Board includes sector operator and growth equity investor."
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
