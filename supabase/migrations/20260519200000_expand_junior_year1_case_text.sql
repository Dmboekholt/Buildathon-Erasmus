-- Expand Year 1 (junior_year = 1) curriculum case narratives with richer context and financial exhibits.

UPDATE public.curriculum_cases SET case_text = $txt$Engagement: Quality-of-earnings support on NordTrail Industrial Supply, a PE-backed mid-cap distributor of MRO fasteners, hydraulics, and safety consumables across the UK and Benelux. The sponsor is refinancing ahead of a bolt-on program and asked the team to explain why operating cash flow weakened despite "strong underlying demand."

Business context
NordTrail sells ~62% to trade counters and regional OEMs, 28% to on-site vending programs at factories, and 10% to public-sector framework contracts. Revenue is recognized on dispatch; rebates are accrued quarterly. The business historically ran lean inventory (high turns, predictable supplier terms) and collected within 45–50 days on average.

In the last twelve months, NordTrail launched a "strategic account" program offering extended payment terms to win two large vending rollouts. Procurement also pre-bought copper-linked fittings ahead of a feared supply squeeze. Management's narrative in the data room emphasizes 9% revenue growth and market share gains in vending.

LTM summary (GBP millions, management accounts)
                          Prior LTM    Current LTM
Revenue                      412.0        449.1
Gross profit                  98.9        107.8
EBITDA                        41.2         43.6
Operating cash flow           28.4         22.1

Trade working capital metrics
                          Prior LTM    Current LTM
DSO (days)                      48           62
Inventory turns (x)          6.2x         4.8x
DPO (days)                      41           39
Cash conversion cycle (days)    55           73

Receivables aging (% of gross AR)
                Prior    Current
0–30 days        71%      58%
31–60 days       19%      22%
61–90 days        7%      12%
90+ days          3%       8%

Inventory composition (GBP millions)
                Prior    Current
Raw materials     18.2     24.6
Finished goods    22.4     31.8
Obsolescence reserve (1.1)  (1.4)

Management talking points
The CFO attributes the cash decline to "timing and growth investment," citing the vending wins and supplier prepayments. The CEO highlights that sell-through to end customers remains healthy and that bad debt expense is flat year over year. Seasonality is mentioned: Q4 revenue was front-loaded for year-end rebate targets.

Signals worth weighing
Operating cash flow fell £6.3m while EBITDA rose modestly. DSO stretched 14 days; inventory turns fell materially. The 90+ day receivables bucket doubled as a share of AR. Finished goods inventory grew faster than revenue. Bad debt being flat does not rule out collection slippage on large, new accounts.

Plausible but secondary explanations
Management suggests seasonality and rebate timing; Q4 billings were heavy. A competitor's failure in Benelux may have caused one-off share gains that do not repeat. These may explain part of the story but should be tested against aging and SKU-level inventory data before accepting them as the primary driver.$txt$,
  updated_at = now()
WHERE id = 'c1111111-1111-1111-1111-111111111111';

UPDATE public.curriculum_cases SET case_text = $txt$Engagement: Two-year post-merger integration review for Meridian Pantry Co. following its horizontal combination with Harbor Brands (snacking and private-label biscuits). The deal thesis relied on procurement scale, route-to-market overlap, and a pro forma gross margin uplift of 120 bps by year two. Integration costs were budgeted to peak in year one.

Business context
Meridian sells branded and own-label products through grocery, convenience, and discounters. Harbor brought stronger discounter relationships but a higher promotional intensity. The combined entity reports on a calendar year; synergy tracking is maintained in a monthly bridge owned by the integration management office (IMO).

At the two-year mark, procurement synergies on packaging and logistics are ahead of the deal model, but consolidated gross margin is 180 bps below the pro forma plan. Revenue is broadly in line with plan (+1.2%), yet realized price/mix is weaker in the discounter channel. The IMO notes duplicate co-manufacturing lines still running in the Midlands and higher trade spend to defend shelf space.

Gross margin bridge vs pro forma plan (bps, year-two run rate)
                                    Plan    Actual   Variance
Volume / mix                         +40       +15      (25)
Pricing / promo                      +35       (20)     (55)
Procurement synergies                +80       +95      +15
Manufacturing / logistics            +25       (10)     (35)
Integration & stranded costs         (60)      (90)     (30)
Total vs pro forma plan              +120      (60)    (180)

Procurement synergy tracker (EUR millions, annualized run rate)
Category              Target    Achieved   Status
Packaging               18.0       19.4   Ahead
Ingredients              9.5        8.1   Slightly behind
Logistics / freight      6.2        7.0   Ahead
Total                   33.7       34.5   Ahead of target

Channel mix (% of net revenue, year two)
                Meridian    Harbor    Combined
Grocery            44%        38%        41%
Discounters        18%        31%        26%
Convenience        22%        14%        17%
Other              16%        17%        16%

Management talking points
The CFO states that synergy capture is "on or ahead of plan" and that margin will normalize once promotional resets complete. Commercial leadership argues that defending discounter listings was necessary to protect volume synergies. Operations cites temporary duplicate running costs until a single ERP go-live in month 26.

Signals worth weighing
Procurement is ahead while gross margin misses by 180 bps. Pricing/promo and manufacturing/integration lines explain most of the variance. Channel mix shifted toward lower-margin discounter revenue. Duplicate co-man lines and higher trade spend are called out internally.

Plausible but secondary explanations
Input cost inflation on cocoa and energy is often cited; however, procurement savings were supposed to offset commodity pressure. Foreign exchange on Harbor's export snacks is a small headwind. These factors may matter at the margin but do not explain a miss of this size on their own.$txt$,
  updated_at = now()
WHERE id = 'c2222222-2222-2222-2222-222222222222';

UPDATE public.curriculum_cases SET case_text = $txt$Engagement: Sell-side due diligence on CloudBridge Solutions, a B2B software reseller that implements ERP, CRM, and security platforms for mid-market customers. The company sells multi-year subscription and support contracts but also bundles implementation and training. Investors are focused on recurring quality and whether reported growth converts to cash.

Business context
CloudBridge recognizes revenue on multi-year contracts at contract signing, net of estimated cancellations. Implementation milestones exist in contracts but management states that "substantive delivery occurs at kickoff" for most deals. Billings are typically annual in advance; revenue is booked upfront for the full contract term.

The company grew headcount in sales engineering and inside sales to pursue larger enterprise logos. Average contract length increased from 2.4 to 3.1 years. Management highlights 22% billings growth and improving win rates in the investor deck.

LTM metrics (USD millions)
                          Prior LTM    Current LTM
Billings                      118.4        144.0
Revenue recognized            109.2        133.1
Deferred revenue (end)         41.6         35.4
Accounts receivable (end)        28.2         36.8
DSO (days)                       52           61

Contract economics (management summary)
                          Prior LTM    Current LTM
New bookings (TCV)             96.2        121.5
Avg contract length (years)     2.4          3.1
Implementation attach rate       68%          74%
Gross margin on services         31%          29%

Quarterly trend (USD millions)
                Q1     Q2     Q3     Q4
Billings        32.1   34.0   35.2   42.7
Revenue         30.5   31.8   33.0   37.8
Deferred rev.   39.8   38.2   36.9   35.4

Revenue recognition policy (excerpt)
"For standard multi-year subscription and support agreements, revenue is recognized in full at signing when collectability is probable and the company has commenced delivery activities, including project kickoff and access provisioning."

Management talking points
The CEO attributes deferred revenue decline to "faster conversion of backlog into recognized revenue" and improved implementation velocity. The CFO notes that DSO increased because several large enterprise customers negotiated quarterly invoicing despite upfront recognition. Churn remains below 6% on a logo basis.

Signals worth weighing
Billings grew 22% while deferred revenue fell 15% and DSO rose. Revenue growth outpaced billings in the period, implying prior deferred balances were released into revenue. Quarterly deferred revenue stepped down each quarter. Implementation attach rose while services margin compressed, suggesting heavier upfront project work.

Plausible but secondary explanations
Management points to enterprise mix and billing term changes. A one-time partner rebate in Q4 increased billings. Seasonal budget flush may have pulled signings forward. These may affect timing but should be reconciled to deferred revenue, delivery evidence, and cash collection quality.

Items to request in diligence
Signed contracts for the top ten TCV deals in the year, acceptance clauses, cancellation/refund history, and a billings-to-cash reconciliation by vintage quarter.$txt$,
  updated_at = now()
WHERE id = 'c6666666-6666-6666-6666-666666666661';

UPDATE public.curriculum_cases SET case_text = $txt$Engagement: Lender covenant review and QoE-style normalization for Apex Field Services Group, a national provider of facilities maintenance, cleaning, and on-site staffing for retail and logistics parks. The company is refinancing a unitranche facility; the bank asked for a reported-to-adjusted EBITDA bridge and clarity on run-rate opex.

Business context
Apex earns revenue through multi-year site contracts with pass-through costs for consumables and subcontractors. Margins are thin; small accounting choices matter for leverage. Management presented "adjusted EBITDA" in the lender model but the audit file shows several items embedded in reported EBITDA that need analyst judgment.

Reported EBITDA walk (GBP millions, current LTM)
Reported EBITDA                                      38.4

Adjustments flagged in management deck:
  Insurance recovery (warehouse flood, net)            +2.1
  Temporary wage subsidies (government scheme)       +1.4
  Capitalized internal IT platform costs             +3.6
  Restructuring severance (regional depot closure)     +0.9
  Management-adjusted EBITDA (per deck)                46.4

Underlying opex detail
Internal IT capitalization
  Prior policy: external vendor build, expensed
  Current year: £3.6m capitalized as intangible (18-month dev)
  Related cash opex reduction in same period: £3.6m
  IT headcount FTE: 12 to 28 year over year

Insurance recovery
  Gross claim received £2.4m; fees £0.3m; net P&L credit £2.1m
  Corresponding repair capex in prior year already spent
  No recurrence expected

Wage subsidies
  Scheme covered furloughed depot staff for 4 months
  Program ended; headcount returned to prior levels
  Subsidy recognized as other income, not netted in payroll

Restructuring
  One depot closed; severance £0.9m in EBITDA
  Run-rate SG&A savings claimed: £1.2m annually from month 7
  Savings not yet visible in LTM SG&A (still duplicative lease)

LTM P&L snippet (GBP millions)
                          Prior LTM    Current LTM
Revenue                      312.0        341.5
Gross profit                  49.8         55.2
SG&A                          28.6         31.4
Reported EBITDA               33.1         38.4
Capex                          4.2          5.8

Management talking points
The CFO argues adjusted EBITDA of £46.4m is the "true run rate" because IT investment is strategic and non-recurring items are clearly labeled. Operations states that the IT platform will reduce third-party spend by £2.0m annually starting next year, but no vendor contracts have been terminated yet.

Signals worth weighing
Reported EBITDA grew 14% with help from non-recurring credits and capitalization that suppresses opex. IT capitalization coincides with a step-up in capitalized amounts equal to the opex reduction. Wage subsidies and insurance recovery are clearly time-bound. Restructuring savings are forward-looking.

Plausible but secondary explanations
Management cites inflation pass-through on contracts and new logo wins in logistics parks. Those factors support revenue growth but do not explain the gap between reported and sustainable earnings without normalizing add-backs.

Analyst task framing
Build a simple bridge from reported to normalized EBITDA. For each adjustment, decide whether it belongs in run-rate earnings, below EBITDA, or as a one-off with evidence. Pay particular attention to whether capitalized IT costs reflect recurring spend in a different line.$txt$,
  updated_at = now()
WHERE id = 'c6666667-6667-6667-6667-666666666672';
