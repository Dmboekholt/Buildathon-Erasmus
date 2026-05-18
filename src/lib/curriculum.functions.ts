import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ANALYST_ID = "demo-analyst";
const MODEL = "google/gemini-3-flash-preview";

const LEVELS = [
  "Analyst Basics",
  "Analyst Medium",
  "Analyst Advanced",
  "Senior Basics",
  "Senior Medium",
  "Senior Advanced",
  "Manager Track",
  "Director Track",
  "Executive Track",
  "Expert Advisor",
] as const;

export const LEVEL_NAMES = LEVELS;

async function callAIJson<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userContent: string,
): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached, try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return schema.parse(JSON.parse(raw));
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${(e as Error).message}. Raw response: ${raw.slice(0, 300)}`);
  }
}

const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(20),
  expected_answer: z.string().min(80),
  senior_answer: z.string().min(80),
  ai_answer: z.string().min(80),
});
export type CurriculumQuestion = z.infer<typeof QuestionSchema>;

const SeedCaseSchema = z.object({
  title: z.string(),
  era: z.string(),
  industry: z.string(),
  difficulty: z.number().int().min(1).max(10),
  case_text: z.string().min(1500),
  questions: z.array(QuestionSchema).min(3).max(6),
});
const SeedSingleSchema = z.object({ case: SeedCaseSchema });

const FAMOUS = [
  { title: "RJR Nabisco LBO bidding war", year: "1988", industry: "Consumer goods", difficulty: 4, focus: "leveraged buyout math, EV/EBITDA multiples, debt capacity, bidding dynamics between KKR and management" },
  { title: "AOL Time Warner merger valuation", year: "2000", industry: "Media and internet", difficulty: 3, focus: "stock-for-stock merger, internet bubble multiples, synergy assumptions, dilution to Time Warner shareholders" },
  { title: "Kraft Heinz 3G synergies", year: "2015", industry: "Consumer staples", difficulty: 4, focus: "zero-based budgeting, EBITDA multiple expansion, brand impairment risk, organic growth vs cost cuts" },
  { title: "Valeant Pharmaceuticals roll-up", year: "2015", industry: "Pharma", difficulty: 6, focus: "serial acquisitions, adjusted vs GAAP EBITDA, leverage ratio, specialty pharmacy channel risk" },
  { title: "WeWork S-1 valuation", year: "2019", industry: "Real estate / coworking", difficulty: 5, focus: "community adjusted EBITDA, lease liabilities vs revenue, contribution margin, comparable multiples vs IWG" },
  { title: "Anheuser-Busch InBev leverage post SABMiller", year: "2016", industry: "Beverages", difficulty: 5, focus: "Net debt to EBITDA, FX exposure, synergy realization, dividend sustainability" },
  { title: "Lehman Brothers Repo 105", year: "2008", industry: "Investment banking", difficulty: 7, focus: "off-balance-sheet financing, leverage ratio window-dressing, mark-to-market on Alt-A and CDOs, funding fragility" },
  { title: "General Electric conglomerate discount", year: "2017", industry: "Industrials", difficulty: 5, focus: "sum-of-the-parts valuation, GE Capital insurance reserves, pension underfunding, dividend cover" },
];

function buildCuratedCase(f: (typeof FAMOUS)[number], index: number): z.infer<typeof SeedCaseSchema> {
  const revenue = 6.2 + index * 3.4;
  const ebitda = 1.1 + index * 0.55;
  const debt = 3.8 + index * 1.35;
  const cash = 0.4 + index * 0.2;
  const sharePrice = 24 + index * 6;
  const shares = 120 + index * 35;
  const marketCap = (sharePrice * shares) / 1000;
  const netDebt = debt - cash;
  const enterpriseValue = marketCap + netDebt;
  const currentMultiple = enterpriseValue / ebitda;
  const bidPremium = 0.22 + index * 0.015;
  const offerEquityValue = marketCap * (1 + bidPremium);
  const offerEnterpriseValue = offerEquityValue + netDebt;
  const offerMultiple = offerEnterpriseValue / ebitda;
  const synergies = 0.12 + index * 0.045;
  const synergyValue = synergies * 8;
  const leverage = netDebt / ebitda;

  const fmt = (n: number) => n.toFixed(1);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const caseText = `BACKGROUND
You are reviewing ${f.title} in ${f.year}. The situation has reached the investment committee after several weeks of confidential diligence, press leaks, and banker calls with potential financing sources. The company is in ${f.industry}, and the core debate is whether the market is valuing near term earnings correctly or whether a buyer is underwriting a peak result. Senior bankers have asked for a memo that separates what is observable today from what would only be known after closing. The deal team is working from public filings, management presentations, rating agency commentary, lender feedback, and precedent transaction screens. The central focus is ${f.focus}. The analyst must decide whether the valuation bridge is credible, whether the capital structure is financeable, and which diligence items could change the answer before final bid submission.

FINANCIALS
Revenue ${Number(f.year) - 2}: $${fmt(revenue * 0.86)}bn
Revenue ${Number(f.year) - 1}: $${fmt(revenue * 0.94)}bn
Revenue ${f.year}: $${fmt(revenue)}bn
EBITDA ${f.year}: $${fmt(ebitda)}bn
EBITDA margin ${f.year}: ${pct(ebitda / revenue)}
Gross debt: $${fmt(debt)}bn
Cash: $${fmt(cash)}bn
Net debt: $${fmt(netDebt)}bn
Share price before rumor: $${fmt(sharePrice)}
Diluted shares: ${Math.round(shares)}m
Market capitalization: $${fmt(marketCap)}bn
Current enterprise value: $${fmt(enterpriseValue)}bn
Current EV to EBITDA: ${fmt(currentMultiple)}x
Proposed equity premium: ${pct(bidPremium)}
Offer enterprise value: $${fmt(offerEnterpriseValue)}bn
Offer EV to EBITDA: ${fmt(offerMultiple)}x
Management also provides a preliminary synergy target of $${fmt(synergies)}bn of annual EBITDA by year three. Comparable transactions are clustering at 8.0x to 10.5x EBITDA, but the highest quality comparables have cleaner accounting, lower leverage, and more stable organic growth. The company has reported positive adjusted EBITDA growth, but working capital has consumed cash in two of the last three fiscal years, which makes free cash flow conversion a key diligence point.

MANAGEMENT
The CEO is presenting the transaction as a strategic acceleration rather than a defensive sale. The CFO is more cautious and emphasizes covenant headroom, rating agency optics, and whether adjusted EBITDA excludes recurring costs. Two board members have prior restructuring experience and are focused on downside protection. Another director has a close relationship with one financing bank, which the legal team flags as a governance item to document carefully. Management incentives are meaningful because change in control awards accelerate if the offer closes above the unaffected share price. The senior deal lead wants the analyst to test management's synergy schedule instead of treating it as a valuation plug.

RISKS
The red flags are specific. First, the headline multiple looks defensible only if the synergy target is capitalized at a market multiple. Second, leverage is already ${fmt(leverage)}x before any incremental financing, so lenders may demand amortization, tighter covenants, or a larger equity check. Third, reported margin expansion has come partly from cost actions that may not repeat. Fourth, the comparable set may overstate value because those companies have stronger recurring revenue and cleaner balance sheets. Fifth, management's base case assumes stable demand through closing, but early channel checks show pricing pressure and longer customer decision cycles. The investment committee wants explicit downside math, not a narrative list of concerns.

DEAL DETAILS
The working proposal values the equity at $${fmt(offerEquityValue)}bn and total enterprise value at $${fmt(offerEnterpriseValue)}bn. The financing package under discussion includes secured term debt, unsecured notes, and a sponsor or strategic equity contribution sized to keep closing leverage below the level lenders will tolerate. The break fee is expected to be near 3% of equity value. Approval conditions include board approval, regulatory clearance, committed financing, and a bring down of audited financials. A rival bidder could justify a higher headline price only by assuming faster synergy capture or a lower cost of capital. The senior banker asks for a recommendation that names the right multiple, the acceptable leverage ceiling, and the diligence item most likely to change the bid.`;

  return {
    title: f.title,
    era: f.year,
    industry: f.industry,
    difficulty: f.difficulty,
    case_text: caseText,
    questions: [
      {
        id: "q1",
        prompt: "Calculate the current EV to EBITDA multiple and the offer EV to EBITDA multiple. What does the change tell you about the bid?",
        expected_answer: `Current enterprise value is market capitalization of $${fmt(marketCap)}bn plus net debt of $${fmt(netDebt)}bn, or $${fmt(enterpriseValue)}bn. Dividing by EBITDA of $${fmt(ebitda)}bn gives ${fmt(currentMultiple)}x. The offer enterprise value is $${fmt(offerEnterpriseValue)}bn, which equals ${fmt(offerMultiple)}x EBITDA. The bid therefore prices a meaningful premium to the unaffected trading value, so the buyer must underwrite synergies, better growth, or a control premium to make the economics work.`,
        senior_answer: `I would not stop at the mechanical multiple. The question is whether ${fmt(offerMultiple)}x is paying for durable EBITDA or for an adjusted number that may not convert to cash. I would triangulate against precedent deals, free cash flow yield, and downside leverage. If the buyer needs all of the synergy value to justify the premium, the bid has very little margin for error.`,
        ai_answer: `The unaffected EV is $${fmt(enterpriseValue)}bn and the unaffected EV to EBITDA multiple is ${fmt(currentMultiple)}x. The offer EV is $${fmt(offerEnterpriseValue)}bn and the offer multiple is ${fmt(offerMultiple)}x. The premium implies the acquirer is paying above the current market view and needs either synergy capture or a higher quality earnings base. I would frame the bid as financeable only if diligence supports EBITDA durability.`,
      },
      {
        id: "q2",
        prompt: "If year three EBITDA synergies of the stated amount are valued at 8.0x, how much value do they contribute and how much of the offer premium do they cover?",
        expected_answer: `The annual EBITDA synergy target is $${fmt(synergies)}bn. At 8.0x, those synergies are worth about $${fmt(synergyValue)}bn before timing, execution risk, and tax effects. The equity premium is approximately $${fmt(offerEquityValue - marketCap)}bn, so the synergy value covers about ${Math.round((synergyValue / (offerEquityValue - marketCap)) * 100)}% of the premium on a simple capitalized basis. That is helpful, but it is not a full answer because synergy realization is delayed and risky.`,
        senior_answer: `I would haircut the synergy value rather than crediting the full 8.0x. Some savings require upfront cost, some may leak to customers, and the market may not capitalize temporary cost cuts at the same multiple as core earnings. If the capitalized synergy value is doing most of the work, I would ask for a synergy bridge by initiative, owner, timing, and required investment.`,
        ai_answer: `Capitalizing $${fmt(synergies)}bn of EBITDA synergies at 8.0x gives $${fmt(synergyValue)}bn of gross value. The premium over unaffected equity value is $${fmt(offerEquityValue - marketCap)}bn. On that basis, synergies cover roughly ${Math.round((synergyValue / (offerEquityValue - marketCap)) * 100)}% of the premium before risk adjustments. I would discount the value for timing and execution risk before using it in the bid recommendation.`,
      },
      {
        id: "q3",
        prompt: "What are the two most important risks you would push back on before recommending that the team start or support the case?",
        expected_answer: `The first risk is quality of EBITDA because the valuation depends on adjusted earnings, repeatability of margin expansion, and cash conversion. The second risk is leverage because net debt is $${fmt(netDebt)}bn and current net debt to EBITDA is ${fmt(leverage)}x before any new financing. I would also flag governance and comparability, but the core pushback is whether the deal can sustain the offer multiple if EBITDA is lower or lenders require a more conservative capital structure.`,
        senior_answer: `My pushback would be direct: prove the EBITDA and prove the financing. I would ask the team to reconcile adjusted EBITDA to cash flow, identify recurring add backs, and stress test the case at a lower exit multiple. Then I would ask financing sources where covenant capacity actually breaks. Those two checks matter more than a polished precedent transaction page.`,
        ai_answer: `The main risks are earnings quality and capital structure resilience. The offer multiple is only attractive if EBITDA is real, repeatable, and convertible to cash, while leverage of ${fmt(leverage)}x already limits flexibility. I would also review governance conflicts and whether the comparable set is too generous. The recommendation should require diligence on cash conversion, add backs, lender appetite, and downside covenant headroom.`,
      },
    ],
  };
}

async function seedAll(): Promise<{ seeded: number; failures: { title: string; reason: string }[] }> {
  const seeded: string[] = [];
  const failures: { title: string; reason: string }[] = [];
  const cases = FAMOUS.map((f, index) => buildCuratedCase(f, index));
  for (const c of cases) {
    const parsed = SeedCaseSchema.safeParse(c);
    if (!parsed.success) {
      failures.push({ title: c.title, reason: parsed.error.message });
      continue;
    }
    const { error } = await supabaseAdmin.from("curriculum_cases").insert({
      title: c.title,
      era: c.era,
      industry: c.industry,
      difficulty: c.difficulty,
      case_text: c.case_text,
      expected_insights: c.questions.map((q) => q.prompt),
      historical_answer: c.questions.map((q) => q.expected_answer).join("\n\n"),
      ai_answer: c.questions.map((q) => q.ai_answer).join("\n\n"),
      senior_reasoning: c.questions.map((q) => q.senior_answer).join("\n\n"),
      questions: c.questions,
      source: "seeded",
    });
    if (error) {
      failures.push({ title: c.title, reason: `db: ${error.message}` });
    } else {
      seeded.push(c.title);
    }
  }
  return { seeded: seeded.length, failures };
}

export const seedCurriculumIfEmpty = createServerFn({ method: "POST" }).handler(
  async () => {
    const { count, error: cErr } = await supabaseAdmin
      .from("curriculum_cases")
      .select("id", { count: "exact", head: true })
      .eq("source", "seeded");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) return { seeded: 0, failures: [] };
    return seedAll();
  },
);

export const forceReseedCurriculum = createServerFn({ method: "POST" }).handler(
  async () => {
    await supabaseAdmin.from("curriculum_attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("curriculum_cases").delete().eq("source", "seeded");
    return seedAll();
  },
);

export const getProgress = createServerFn({ method: "GET" }).handler(async () => {
  const { data: prog } = await supabaseAdmin
    .from("curriculum_progress")
    .select("level")
    .eq("analyst_id", ANALYST_ID)
    .maybeSingle();
  const level = prog?.level ?? 1;

  const { data: recent } = await supabaseAdmin
    .from("curriculum_attempts")
    .select("accuracy_score, analyst_level, created_at, case_id")
    .eq("analyst_id", ANALYST_ID)
    .order("created_at", { ascending: false })
    .limit(10);

  const atLevel = (recent ?? []).filter((r) => r.analyst_level === level).slice(0, 5);
  const rollingAvg =
    atLevel.length === 0
      ? 0
      : Math.round(
          atLevel.reduce((s, r) => s + (r.accuracy_score ?? 0), 0) / atLevel.length,
        );

  return {
    level,
    levelName: LEVELS[level - 1],
    rollingAvg,
    rollingCount: atLevel.length,
    promotionTarget: 80,
    recent: recent ?? [],
  };
});

export const listCases = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("curriculum_cases")
    .select("id, title, era, industry, difficulty, source, created_at")
    .eq("source", "seeded")
    .order("difficulty", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCase = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ caseId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: c, error } = await supabaseAdmin
      .from("curriculum_cases")
      .select("id, title, era, industry, difficulty, case_text, questions")
      .eq("id", data.caseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Case not found");
    const questions = (c.questions as CurriculumQuestion[] | null) ?? [];
    return {
      id: c.id as string,
      title: c.title as string,
      era: c.era as string | null,
      industry: c.industry as string | null,
      difficulty: c.difficulty as number,
      case_text: c.case_text as string,
      // Send only prompts to the client during the in-progress state.
      questions: questions.map((q) => ({ id: q.id, prompt: q.prompt })),
    };
  });

const PerQuestionScoreSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string().max(800),
});
const SubmitScoreSchema = z.object({
  per_question: z.array(PerQuestionScoreSchema),
  accuracy_score: z.number().min(0).max(100),
  alignment_historical: z.number().min(0).max(100),
  alignment_ai: z.number().min(0).max(100),
  alignment_senior: z.number().min(0).max(100),
  skill_indicators: z.object({
    insight: z.number().min(0).max(100),
    risk_awareness: z.number().min(0).max(100),
    pattern_recognition: z.number().min(0).max(100),
  }),
  feedback: z.string().max(2000),
});

export const submitAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        caseId: z.string().uuid(),
        answers: z.record(z.string(), z.string().min(1).max(4000)),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: c, error: cErr } = await supabaseAdmin
      .from("curriculum_cases")
      .select("id, title, case_text, questions")
      .eq("id", data.caseId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!c) throw new Error("Case not found");

    const questions = (c.questions as CurriculumQuestion[] | null) ?? [];
    if (questions.length === 0) throw new Error("Case has no questions");

    const { data: prog } = await supabaseAdmin
      .from("curriculum_progress")
      .select("level")
      .eq("analyst_id", ANALYST_ID)
      .maybeSingle();
    const level = prog?.level ?? 1;

    const evalPayload = questions.map((q) => ({
      id: q.id,
      question: q.prompt,
      expected_answer: q.expected_answer,
      senior_answer: q.senior_answer,
      ai_answer: q.ai_answer,
      analyst_answer: data.answers[q.id] ?? "",
    }));

    const systemPrompt = `You are a senior investment analyst grading a junior analyst's answers to a multi-question historical case. Score honestly. Average performance is around 60. Output strict JSON only. Never use em dashes or en dashes.`;
    const userContent = `Case title: ${c.title}

Per question evaluation set (compare analyst_answer against expected_answer, senior_answer, ai_answer):
${JSON.stringify(evalPayload, null, 2)}

Return strict JSON with this shape:
{
  "per_question": [ { "id": <question id>, "score": 0-100, "feedback": short 1-3 sentence note } ],
  "accuracy_score": 0-100 (overall, weighted average of per_question),
  "alignment_historical": 0-100 (how close overall to the expected answers),
  "alignment_ai": 0-100 (how close overall to the AI answers),
  "alignment_senior": 0-100 (how close overall to the senior answers),
  "skill_indicators": { "insight": 0-100, "risk_awareness": 0-100, "pattern_recognition": 0-100 },
  "feedback": short paragraph of constructive overall feedback, 2 to 4 sentences
}`;

    const scored = await callAIJson(SubmitScoreSchema, systemPrompt, userContent);

    const perQuestionMap: Record<string, { score: number; feedback: string }> = {};
    for (const p of scored.per_question) {
      perQuestionMap[p.id] = { score: Math.round(p.score), feedback: p.feedback };
    }

    const { data: row, error: aErr } = await supabaseAdmin
      .from("curriculum_attempts")
      .insert({
        case_id: c.id,
        analyst_id: ANALYST_ID,
        analyst_level: level,
        written_insight: "",
        answers: data.answers,
        per_question_scores: perQuestionMap,
        accuracy_score: Math.round(scored.accuracy_score),
        alignment_historical: Math.round(scored.alignment_historical),
        alignment_ai: Math.round(scored.alignment_ai),
        alignment_senior: Math.round(scored.alignment_senior),
        skill_indicators: scored.skill_indicators,
        feedback: scored.feedback,
      })
      .select("id")
      .single();
    if (aErr) throw new Error(aErr.message);

    return {
      attemptId: row.id as string,
      scored,
      reveal: {
        title: c.title as string,
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          analyst_answer: data.answers[q.id] ?? "",
          expected_answer: q.expected_answer,
          senior_answer: q.senior_answer,
          ai_answer: q.ai_answer,
          score: perQuestionMap[q.id]?.score ?? 0,
          feedback: perQuestionMap[q.id]?.feedback ?? "",
        })),
      },
    };
  });

export const listAttempts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("curriculum_attempts")
      .select(
        "id, case_id, analyst_level, accuracy_score, alignment_historical, alignment_ai, alignment_senior, feedback, created_at, curriculum_cases(title)",
      )
      .eq("analyst_id", ANALYST_ID)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);
