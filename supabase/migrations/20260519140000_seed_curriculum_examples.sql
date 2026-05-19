-- Example curriculum units: three archive-style cases + reference answers on existing cases

UPDATE public.curriculum_cases SET
  historical_answer = 'The deterioration likely reflects slower collections on receivables as DSO stretched from 48 to 62 days, plus inventory build as turns fell from 6.2x to 4.8x. Revenue growth without cash conversion points to working capital absorption rather than underlying demand collapse.',
  senior_reasoning = 'Always tie DSO and inventory moves to operational drivers before blaming seasonality. Ask whether receivables aging shifted at month-end and whether inventory is finished goods vs raw materials.'
WHERE id = 'c1111111-1111-1111-1111-111111111111';

UPDATE public.curriculum_cases SET
  historical_answer = 'Revenue-side: customer mix shifted toward lower-margin channels or promotional pricing eroded realized price. Cost-side: integration costs or duplicate overhead offset procurement synergies that were ahead of plan.',
  senior_reasoning = 'When procurement synergies beat plan but gross margin misses, the story is rarely procurement alone. Split revenue bridge (volume, price, mix) from cost bridge (COGS, stranded costs, integration).'
WHERE id = 'c2222222-2222-2222-2222-222222222222';

INSERT INTO public.curriculum_cases (
  id, title, case_text, questions, expected_insights, difficulty, era, industry, source,
  ai_answer, historical_answer, senior_reasoning
) VALUES (
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
