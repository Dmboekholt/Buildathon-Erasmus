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
    throw new Error(`Failed to parse AI response: ${(e as Error).message}`);
  }
}

const SeedCaseSchema = z.object({
  title: z.string(),
  era: z.string(),
  industry: z.string(),
  difficulty: z.number().int().min(1).max(10),
  case_text: z.string(),
  expected_insights: z.array(z.string()).min(2).max(8),
  historical_answer: z.string(),
  ai_answer: z.string(),
  senior_reasoning: z.string(),
});
const SeedBatchSchema = z.object({ cases: z.array(SeedCaseSchema).min(4).max(10) });

const FAMOUS = [
  { title: "Enron accounting collapse", year: "2001", industry: "Energy", difficulty: 3 },
  { title: "Long Term Capital Management blowup", year: "1998", industry: "Hedge Funds", difficulty: 4 },
  { title: "AOL Time Warner merger", year: "2000", industry: "Media", difficulty: 2 },
  { title: "Lehman Brothers bankruptcy", year: "2008", industry: "Investment Banking", difficulty: 5 },
  { title: "WorldCom accounting fraud", year: "2002", industry: "Telecom", difficulty: 3 },
  { title: "Theranos valuation collapse", year: "2015", industry: "HealthTech", difficulty: 4 },
  { title: "Wirecard missing cash", year: "2020", industry: "Payments", difficulty: 6 },
  { title: "Kodak digital transition failure", year: "2000s", industry: "Imaging", difficulty: 2 },
];

export const seedCurriculumIfEmpty = createServerFn({ method: "POST" }).handler(
  async () => {
    const { count, error: cErr } = await supabaseAdmin
      .from("curriculum_cases")
      .select("id", { count: "exact", head: true });
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) return { seeded: 0 };

    const prompt = `For each of the following historical financial events, produce a structured learning challenge for a junior investment analyst. Output strict JSON: { "cases": [...] }.

Each case object:
{
  "title": string,
  "era": string (e.g. "2001"),
  "industry": string,
  "difficulty": integer 1-10 (use the provided difficulty),
  "case_text": 6 to 10 sentence scenario written in the present tense, omitting the outcome, with the financial signals an analyst could have noticed at the time,
  "expected_insights": array of 3 to 5 short insight strings (the key things a sharp analyst should call out),
  "historical_answer": what actually happened plus the senior team conclusion (3 to 5 sentences),
  "ai_answer": an AI analyst's structured take written in the moment, with stated assumptions (3 to 5 sentences),
  "senior_reasoning": how an experienced senior analyst would frame the situation, focusing on pattern recognition, risk, and judgment (3 to 5 sentences)
}

Rules:
- Never use em dashes or en dashes. Use commas, colons, or periods.
- Be specific. Reference real numbers, ratios, or facts where they exist.
- Do not reveal the outcome inside case_text.

Cases to generate:
${JSON.stringify(FAMOUS)}`;

    const out = await callAIJson(
      SeedBatchSchema,
      "You are a curriculum designer for investment analysts. Output strict JSON only.",
      prompt,
    );

    const rows = out.cases.map((c) => ({
      title: c.title,
      era: c.era,
      industry: c.industry,
      difficulty: c.difficulty,
      case_text: c.case_text,
      expected_insights: c.expected_insights,
      historical_answer: c.historical_answer,
      ai_answer: c.ai_answer,
      senior_reasoning: c.senior_reasoning,
      source: "seeded",
    }));
    const { error: iErr, count: inserted } = await supabaseAdmin
      .from("curriculum_cases")
      .insert(rows, { count: "exact" });
    if (iErr) throw new Error(iErr.message);
    return { seeded: inserted ?? rows.length };
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

export const pickCaseForLevel = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data: prog } = await supabaseAdmin
      .from("curriculum_progress")
      .select("level")
      .eq("analyst_id", ANALYST_ID)
      .maybeSingle();
    const level = prog?.level ?? 1;

    const { data: cases } = await supabaseAdmin
      .from("curriculum_cases")
      .select("id, title, era, industry, difficulty, case_text, expected_insights")
      .lte("difficulty", level + 1)
      .order("difficulty", { ascending: true });

    if (!cases || cases.length === 0) return null;

    const { data: attempts } = await supabaseAdmin
      .from("curriculum_attempts")
      .select("case_id")
      .eq("analyst_id", ANALYST_ID);
    const attempted = new Set((attempts ?? []).map((a) => a.case_id));

    const fresh = cases.filter((c) => !attempted.has(c.id));
    const pool = fresh.length > 0 ? fresh : cases;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: pick.id,
      title: pick.title,
      era: pick.era,
      industry: pick.industry,
      difficulty: pick.difficulty,
      case_text: pick.case_text,
      expected_insight_count: (pick.expected_insights ?? []).length,
      analyst_level: level,
    };
  },
);

const ScoreSchema = z.object({
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
        writtenInsight: z.string().min(1).max(8000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: c, error: cErr } = await supabaseAdmin
      .from("curriculum_cases")
      .select(
        "id, title, case_text, expected_insights, historical_answer, ai_answer, senior_reasoning",
      )
      .eq("id", data.caseId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!c) throw new Error("Case not found");

    const { data: prog } = await supabaseAdmin
      .from("curriculum_progress")
      .select("level")
      .eq("analyst_id", ANALYST_ID)
      .maybeSingle();
    const level = prog?.level ?? 1;

    const systemPrompt = `You are a senior investment analyst evaluating a junior analyst's written insight on a historical case. Score honestly. Average performance is around 60. Output strict JSON only. Never use em dashes or en dashes.`;
    const userContent = `Case title: ${c.title}
Case text: ${c.case_text}
Expected insights: ${JSON.stringify(c.expected_insights)}
Historical answer (ground truth): ${c.historical_answer}
AI answer: ${c.ai_answer}
Senior reasoning: ${c.senior_reasoning}

Analyst answer:
"""
${data.writtenInsight}
"""

Return JSON with exactly this shape:
{
  "accuracy_score": 0-100 (overall correctness of the analyst's insight),
  "alignment_historical": 0-100 (how close to what actually happened and the senior team conclusion),
  "alignment_ai": 0-100 (how close to the AI's structured take),
  "alignment_senior": 0-100 (how close to senior-style reasoning),
  "skill_indicators": { "insight": 0-100, "risk_awareness": 0-100, "pattern_recognition": 0-100 },
  "feedback": short paragraph of constructive feedback, 2 to 4 sentences
}`;

    const scored = await callAIJson(ScoreSchema, systemPrompt, userContent);

    const { data: row, error: aErr } = await supabaseAdmin
      .from("curriculum_attempts")
      .insert({
        case_id: c.id,
        analyst_id: ANALYST_ID,
        analyst_level: level,
        written_insight: data.writtenInsight,
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
        title: c.title,
        expected_insights: c.expected_insights,
        historical_answer: c.historical_answer,
        ai_answer: c.ai_answer,
        senior_reasoning: c.senior_reasoning,
      },
    };
  });

const SeniorCaseSchema = SeedCaseSchema;

export const submitSeniorCase = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        title: z.string().min(1).max(200),
        rawText: z.string().min(20).max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Convert the following senior submitted case material into a structured learning challenge. Output strict JSON matching this shape:
{
  "title": string (use the supplied title or refine it),
  "era": string,
  "industry": string,
  "difficulty": integer 1-10,
  "case_text": 6 to 10 sentence scenario, omit the outcome,
  "expected_insights": 3 to 5 short strings,
  "historical_answer": 3 to 5 sentences,
  "ai_answer": 3 to 5 sentences,
  "senior_reasoning": 3 to 5 sentences
}

Rules: never use em dashes or en dashes. Be specific.

Supplied title: ${data.title}
Raw material:
"""
${data.rawText}
"""`;
    const parsed = await callAIJson(
      SeniorCaseSchema,
      "You are a curriculum designer for investment analysts. Output strict JSON only.",
      prompt,
    );
    const { data: row, error } = await supabaseAdmin
      .from("curriculum_cases")
      .insert({
        title: parsed.title,
        era: parsed.era,
        industry: parsed.industry,
        difficulty: parsed.difficulty,
        case_text: parsed.case_text,
        expected_insights: parsed.expected_insights,
        historical_answer: parsed.historical_answer,
        ai_answer: parsed.ai_answer,
        senior_reasoning: parsed.senior_reasoning,
        source: "senior_upload",
      })
      .select("id, title, difficulty")
      .single();
    if (error) throw new Error(error.message);
    return row;
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

export const listCases = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("curriculum_cases")
    .select("id, title, era, industry, difficulty, source, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});
