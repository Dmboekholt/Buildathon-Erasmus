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

async function seedAll(): Promise<{ seeded: number; failures: { title: string; reason: string }[] }> {
  const systemPrompt = `You are a curriculum designer for investment banking and equity research analysts. You write long, dense, numerically rich historical financial cases that read like a real deal memo. Output strict JSON only. Never use em dashes or en dashes. Use periods, commas, or colons instead.`;

  const seeded: string[] = [];
  const failures: { title: string; reason: string }[] = [];
  for (const f of FAMOUS) {
    const userContent = `Produce ONE in-depth historical case for an analyst. Output strict JSON: { "case": {...} }.

Required case object:
{
  "title": "${f.title}",
  "era": "${f.year}",
  "industry": "${f.industry}",
  "difficulty": ${f.difficulty},
  "case_text": a long, dense scenario AT LEAST 1800 characters (about 350+ words) written in the present tense as if the analyst is in the room at the time. It MUST be broken into the following labeled sections, each as a paragraph that starts with the bold-style label on its own line:

    BACKGROUND
    (deal context, timeline, who initiated the transaction, market environment)

    FINANCIALS
    (revenue, EBITDA, EBITDA margin, growth rate, leverage / Net Debt to EBITDA, share price, market cap, trading multiples, comparable transactions. Include a small inline data table written as plain text lines like "Revenue 2014: 6.1bn".)

    MANAGEMENT
    (CEO, CFO, board composition, prior track record, incentive structure, governance red or green flags)

    RISKS
    (concrete risks and red flags an analyst could see at the time: accounting, customer concentration, regulatory, refinancing, cyclicality, etc.)

    DEAL DETAILS
    (price / offer, structure: cash vs stock vs mixed, financing, covenants, break fee, expected synergies, comparable precedent multiples, key approval conditions)

    Focus area: ${f.focus}.
    Do NOT reveal the eventual outcome anywhere in case_text.

  "questions": array of 3 to 6 structured analyst questions. Each question:
    {
      "id": short slug like "q1",
      "prompt": a specific analytical question that requires reasoning with the numbers above (e.g. "What EV/EBITDA multiple would you apply and what is the implied enterprise value, given the comparable set in the case?"),
      "expected_answer": the textbook / historical correct answer with the actual numbers and the methodology, 3 to 6 sentences,
      "senior_answer": how an experienced senior analyst would answer, focused on judgment, what they would push back on, what they would triangulate, 3 to 6 sentences,
      "ai_answer": a structured AI analyst answer with stated assumptions and a numerical estimate, 3 to 6 sentences
    }
}

Rules:
- case_text MUST contain all five section headers (BACKGROUND, FINANCIALS, MANAGEMENT, RISKS, DEAL DETAILS) and MUST be at least 1800 characters.
- At least 3 questions total. At least 2 of them must require a numerical calculation (multiples, leverage, accretion/dilution, IRR, synergy value). At least 1 must be about risk or what the analyst would push back on.
- Never use em dashes or en dashes.
- Output strict JSON only, no commentary.`;

    let lastReason = "unknown error";
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const out = await callAIJson(SeedSingleSchema, systemPrompt, userContent);
        const c = out.case;
        const missingSections = ["BACKGROUND", "FINANCIALS", "MANAGEMENT", "RISKS", "DEAL DETAILS"].filter(
          (section) => !c.case_text.includes(section),
        );
        if (missingSections.length > 0) {
          throw new Error(`missing sections: ${missingSections.join(", ")}`);
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
        if (error) throw new Error(`db: ${error.message}`);
        seeded.push(c.title);
        lastReason = "";
        break;
      } catch (e) {
        lastReason = (e as Error).message;
        console.error(`Seed failed for ${f.title} on attempt ${attempt}:`, lastReason);
      }
    }
    if (lastReason) {
      failures.push({ title: f.title, reason: lastReason });
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
