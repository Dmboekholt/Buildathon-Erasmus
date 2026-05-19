-- Twelve curriculum assignments: 4 per junior year

UPDATE public.profiles SET junior_year = 1 WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET junior_year = 2 WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET junior_year = 3 WHERE id = '33333333-3333-3333-3333-333333333333';

INSERT INTO public.curriculum_cases (
  id, title, case_text, learning_objective, questions, expected_insights,
  junior_year, sort_order, difficulty, era, industry, source,
  ai_answer, historical_answer, senior_reasoning
) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'Working capital bridge',
  'A mid-cap industrial distributor reported DSO rising from 48 to 62 days while inventory turns fell from 6.2x to 4.8x. Revenue grew 9% but operating cash flow declined year over year.',
  'Understand how receivables and inventory drive operating cash flow when revenue grows but cash does not.',
  $q$[{"id":"q1","prompt":"What are the two most likely drivers of the cash flow deterioration?","guidance":"Link receivables and inventory to operations."},{"id":"q2","prompt":"What follow-up questions would you ask management?","guidance":"Be specific to trade working capital."}]$q$::jsonb,
  ARRAY['receivables','inventory','DSO','collections','channel stuffing','demand'],
  1, 1, 1, 'Current', 'Industrial distribution', 'Training library', '',
  'The deterioration likely reflects slower collections on receivables as DSO stretched from 48 to 62 days, plus inventory build as turns fell from 6.2x to 4.8x.',
  'Always tie DSO and inventory moves to operational drivers before blaming seasonality.'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Margin compression post-merger',
  'Two years after a horizontal merger, gross margin is down 180 bps versus the pro forma plan, while synergy capture on procurement was ahead of target.',
  'Diagnose margin misses after mergers when cost synergies look on track but gross profit does not.',
  $q$[{"id":"q1","prompt":"Name one revenue-side and one cost-side hypothesis for the margin miss.","guidance":"Avoid generic answers."},{"id":"q2","prompt":"What data would you request to test your top hypothesis?","guidance":"Be specific to the merger context."}]$q$::jsonb,
  ARRAY['mix','pricing','synergy','integration','procurement','discounting'],
  1, 2, 1, 'Historical', 'Consumer staples', 'Training library', '',
  'Revenue-side: mix shifted toward lower-margin channels or promotional pricing eroded realized price. Cost-side: integration costs offset procurement synergies.',
  'When procurement synergies beat plan but gross margin misses, split revenue bridge from cost bridge.'
),
(
  'c6666666-6666-6666-6666-666666666661',
  'Revenue recognition red flags',
  'A software reseller recognizes revenue on multi-year contracts at signing. Billings grew 22% but deferred revenue fell 15% and days sales outstanding increased.',
  'Spot early revenue recognition issues from the interaction of billings, deferred revenue, and receivables.',
  $q$[{"id":"q1","prompt":"What recognition policy risk does this pattern suggest?","guidance":"Think timing of revenue vs cash."},{"id":"q2","prompt":"What would you verify in the contract terms?","guidance":"Delivery, acceptance, cancellation."}]$q$::jsonb,
  ARRAY['deferred revenue','recognition','billings','DSO','contract','delivery'],
  1, 3, 1, 'Current', 'Technology reseller', 'Training library', '',
  'Past analysts flagged upfront recognition on multi-year deals when deferred revenue declined despite billings growth.',
  'Declining deferred revenue with rising DSO often means revenue is running ahead of cash collection quality.'
),
(
  'c6666667-6667-6667-6667-666666666672',
  'EBITDA bridge basics',
  'Reported EBITDA grew 14% but included a one-off insurance recovery, temporary wage subsidies, and capitalized internal IT costs reclassified from opex.',
  'Build a simple reported-to-normalized EBITDA bridge and separate recurring from non-recurring items.',
  $q$[{"id":"q1","prompt":"Which items would you normalize and why?","guidance":"Separate one-off from structural."},{"id":"q2","prompt":"What is the risk if you leave IT capitalization unadjusted?","guidance":"Link to run-rate opex."}]$q$::jsonb,
  ARRAY['EBITDA','normalization','one-off','capitalization','run-rate','recovery'],
  1, 4, 1, 'Current', 'Business services', 'Training library', '',
  'Analysts stripped the insurance recovery and wage subsidies, and reversed capitalized IT to reflect recurring opex.',
  'Always show a line-by-line bridge; management add-backs need evidence, not labels.'
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Recurring revenue mix',
  'A commercial HVAC platform grew revenue 12% but EBITDA margin fell 80 bps. Installation mix shifted toward lower-margin projects while maintenance contract revenue grew only 4%.',
  'Separate recurring service revenue from project installation work when judging margin and cash quality.',
  $q$[{"id":"q1","prompt":"What would you check first in the revenue bridge?","guidance":"Separate recurring vs project revenue."},{"id":"q2","prompt":"What risk does the installation mix shift pose to forward cash flow?","guidance":"Link margin mix to contract backlog."}]$q$::jsonb,
  ARRAY['service','recurring','installation','margin','mix','backlog','maintenance'],
  2, 1, 2, '2019', 'HVAC services', 'Deal archive', '',
  'Past analysts split installation vs maintenance in the bridge and checked whether new installs carried service riders.',
  'Focus on contract renewal rates and gross profit per technician hour, not headline revenue growth.'
),
(
  'c4444444-4444-4444-4444-444444444444',
  'Carve-out stand-alone costs',
  'A precision components division is being carved out. Pro forma SG&A savings are £6.2m, but IT and finance TSAs run 24 months. Inventory fair-value step-up of £11m is under debate.',
  'Stress-test carve-out stand-alone costs, TSAs, and inventory step-up amortization.',
  $q$[{"id":"q1","prompt":"What are the two biggest risks to the stand-alone cost case?","guidance":"Think TSAs and one-off vs recurring."},{"id":"q2","prompt":"How would you approach the inventory step-up amortization period?","guidance":"Use turnover data if possible."}]$q$::jsonb,
  ARRAY['TSA','carve-out','inventory','step-up','SG&A','standalone','ERP'],
  2, 2, 2, '2021', 'Industrial carve-out', 'Deal archive', '',
  'Past analysts stressed TSA exit timing and parallel-run ERP costs; SKU turnover supported 3-year amortization.',
  'Do not take synergy decks at face value until TSAs are priced and staffed.'
),
(
  'c6666668-6668-6668-6668-666666666683',
  'Quality of earnings adjustments',
  'A packaging business reports EBITDA of £41m. Due diligence found £2.8m of customer rebates not accrued in H2, £1.1m of duplicate cost capitalization, and a legal provision that may reverse.',
  'Prioritize QoE adjustments by materiality and sustainability, not management narrative alone.',
  $q$[{"id":"q1","prompt":"Which adjustment would you treat as normalized EBITDA and which as non-recurring?","guidance":"Recurring vs one-off."},{"id":"q2","prompt":"How would the rebate issue affect your view of revenue quality?","guidance":"Accrual discipline."}]$q$::jsonb,
  ARRAY['QoE','rebate','accrual','normalization','provision','EBITDA'],
  2, 3, 2, 'Current', 'Consumer packaging', 'Training library', '',
  'Analysts normalized rebates into EBITDA and treated legal provision reversal as non-operating until probable.',
  'QoE is about sustainable run-rate earnings; every adjustment needs a clear recurring logic.'
),
(
  'c6666669-6669-6669-6669-666666666694',
  'Leverage and covenant headroom',
  'A distributor closes at 4.1x net debt / EBITDA with a springing covenant at 4.5x. Management models deleveraging to 3.0x by year three on 7% EBITDA growth and no working capital drag.',
  'Assess whether leverage path and covenant headroom are robust to modest EBITDA and working capital stress.',
  $q$[{"id":"q1","prompt":"What downside scenario would you run on leverage?","guidance":"EBITDA and NWC."},{"id":"q2","prompt":"What early warning metrics would you track post-close?","guidance":"Covenants and liquidity."}]$q$::jsonb,
  ARRAY['leverage','covenant','deleveraging','EBITDA','working capital','stress'],
  2, 4, 2, 'Current', 'Industrial distribution', 'Training library', '',
  'Past analysts stress-tested flat EBITDA plus 100 bps NWC deterioration and still had headroom but limited buffer.',
  'Springing covenants bite quickly; model NWC and capex, not just EBITDA growth.'
),
(
  'c5555555-5555-5555-5555-555555555555',
  'SaaS cohort quality',
  'A B2B workflow platform reports $48m ARR growing 42% YoY with 118% NRR. S&M rose 55% while CAC payback on 2024 cohorts is quoted at 14 months.',
  'Validate SaaS cohort economics: NRR, churn, CAC payback, and sustainable growth.',
  $q$[{"id":"q1","prompt":"What metrics would you stress-test to validate cohort quality?","guidance":"NRR, churn, and payback."},{"id":"q2","prompt":"What competitive risk could undermine the growth narrative?","guidance":"Enterprise vs mid-market."}]$q$::jsonb,
  ARRAY['NRR','churn','CAC','payback','cohort','ARR','expansion','competition'],
  3, 1, 3, '2023', 'B2B SaaS', 'Deal archive', '',
  'Past analysts triangulated NRR by vintage cohort and reconciled CAC payback to S&M per net new ARR dollar.',
  'Rule-of-40 is only credible if cohort economics are not bought with deteriorating efficiency.'
),
(
  'c666666a-666a-666a-666a-6666666666a5',
  'Roll-up synergy phasing',
  'A metals distributor closed a bolt-on at 8.5x EBITDA. Management claims €4.2m procurement synergies in year one while integration costs are back-loaded and IT systems will not unify until month 18.',
  'Evaluate whether synergy timing and integration costs are credibly phased in a roll-up model.',
  $q$[{"id":"q1","prompt":"What would make you skeptical of year-one synergy capture?","guidance":"Systems and integration."},{"id":"q2","prompt":"How would you phase synergies in the model?","guidance":"Be specific on timing."}]$q$::jsonb,
  ARRAY['synergy','integration','procurement','roll-up','phasing','IT'],
  3, 2, 3, 'Current', 'Industrial distribution', 'Training library', '',
  'Analysts phased procurement synergies from month 9 onward when SKU overlap could be actioned on one ERP.',
  'Synergies without integration path are spreadsheet fiction; tie each euro to a milestone.'
),
(
  'c666666b-666b-666b-666b-6666666666b6',
  'Marketplace take rate and liquidity',
  'A B2B marketplace grew GMV 28% but take rate fell 40 bps and supplier churn rose in the Nordics pilot. Management argues scale will restore pricing power.',
  'Judge marketplace quality through take rate, supplier retention, and liquidity, not GMV alone.',
  $q$[{"id":"q1","prompt":"What does falling take rate with rising GMV suggest?","guidance":"Pricing and mix."},{"id":"q2","prompt":"What due diligence would you do on the Nordics pilot?","guidance":"Supplier and buyer density."}]$q$::jsonb,
  ARRAY['GMV','take rate','churn','marketplace','liquidity','supplier'],
  3, 3, 3, 'Current', 'B2B marketplace', 'Training library', '',
  'Past analysts linked take rate pressure to promotional subsidies in the pilot and checked repeat supplier cohorts.',
  'GMV without retention and take rate discipline is not a durable model.'
),
(
  'c666666c-666c-666c-666c-6666666666c7',
  'Downside valuation stress',
  'A growth equity memo values a vertical SaaS business at 12x ARR. Base case assumes 35% growth for three years; recession case in the appendix shows growth halving and NRR falling to 102%.',
  'Connect operating downside to valuation multiples and identify what breaks first in a stress case.',
  $q$[{"id":"q1","prompt":"What happens to the investment thesis if NRR falls to 102%?","guidance":"Growth and retention."},{"id":"q2","prompt":"What multiple compression would you underwrite in a downside?","guidance":"Link ops to valuation."}]$q$::jsonb,
  ARRAY['valuation','multiple','ARR','NRR','downside','stress','growth'],
  3, 4, 3, 'Current', 'B2B SaaS', 'Training library', '',
  'Analysts haircut ARR multiple to 7-8x when growth halved and expansion slowed, wiping most upside.',
  'Always articulate what metric drives the multiple and what operational level breaks the thesis.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  case_text = EXCLUDED.case_text,
  learning_objective = EXCLUDED.learning_objective,
  questions = EXCLUDED.questions,
  expected_insights = EXCLUDED.expected_insights,
  junior_year = EXCLUDED.junior_year,
  sort_order = EXCLUDED.sort_order,
  difficulty = EXCLUDED.difficulty,
  era = EXCLUDED.era,
  industry = EXCLUDED.industry,
  historical_answer = EXCLUDED.historical_answer,
  senior_reasoning = EXCLUDED.senior_reasoning,
  updated_at = now();
