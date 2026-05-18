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
