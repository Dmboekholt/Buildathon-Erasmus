import { z } from "zod";
import {
  CURRICULUM_MAX_COMPLETION_TOKENS,
  CURRICULUM_PASS_SCORE,
  getCurriculumScoringPrompt,
} from "@/config/curriculum-scoring";
import { kimiChatJson } from "@/lib/kimi";

/** Kimi sometimes returns "None" or a single string instead of JSON arrays. */
function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0 && !/^none$/i.test(item));
  }
  if (value == null) return [];
  const text = String(value).trim();
  if (!text || /^none$/i.test(text) || /^n\/a$/i.test(text)) return [];
  if (text.includes(";")) {
    return text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^none$/i.test(s));
  }
  if (text.includes(",")) {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^none$/i.test(s));
  }
  return [text];
}

function coerceScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n)) return Math.round(Math.min(100, Math.max(0, n)));
  return 0;
}

function coerceBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return /^(true|yes|1|pass)/i.test(value.trim());
  }
  return Boolean(value);
}

const stringArray = z.preprocess(
  coerceStringArray,
  z.array(z.string()).max(15),
);

export const CurriculumEvaluationSchema = z.object({
  overall_score: z.preprocess(coerceScore, z.number().min(0).max(100)),
  passed: z.preprocess(coerceBoolean, z.boolean()),
  alignment_historical: z
    .preprocess((v) => (v == null ? undefined : coerceScore(v)), z.number().min(0).max(100))
    .optional(),
  alignment_model: z
    .preprocess((v) => (v == null ? undefined : coerceScore(v)), z.number().min(0).max(100))
    .optional(),
  alignment_senior: z
    .preprocess((v) => (v == null ? undefined : coerceScore(v)), z.number().min(0).max(100))
    .optional(),
  summary: z.preprocess(
    (v) => String(v ?? "").slice(0, 600),
    z.string().max(600),
  ),
  strengths: stringArray,
  gaps: stringArray,
  skill_indicators: z.preprocess(
    coerceStringArray,
    z.array(z.string()).max(20),
  ),
  per_question: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z
      .array(
        z.object({
          question_id: z.preprocess((v) => String(v ?? ""), z.string()),
          score: z.preprocess(coerceScore, z.number().min(0).max(100)),
          feedback: z.preprocess(
            (v) => String(v ?? "").slice(0, 800),
            z.string().max(800),
          ),
          demonstrated: stringArray,
          missing: stringArray,
        }),
      )
      .max(10),
  ),
});

export type CurriculumEvaluation = z.infer<typeof CurriculumEvaluationSchema>;

export type CurriculumCaseForScoring = {
  title: string;
  case_text: string;
  learning_objective?: string | null;
  expected_insights: string[] | null;
  historical_answer: string;
  ai_answer: string;
  senior_reasoning: string;
  questions: { id: string; prompt: string; guidance?: string }[] | null;
};

export async function scoreCurriculumWithLlm(
  kase: CurriculumCaseForScoring,
  answers: { questionId: string; answer: string }[],
): Promise<CurriculumEvaluation & { passedFinal: boolean }> {
  const questions = kase.questions ?? [];
  const modelAnswer =
    kase.ai_answer?.trim() || kase.historical_answer?.trim() || "";

  const { system, user } = getCurriculumScoringPrompt({
    title: kase.title,
    learningObjective: kase.learning_objective?.trim() || "",
    caseText: kase.case_text,
    expectedInsights: kase.expected_insights ?? [],
    historicalOutcome: kase.historical_answer,
    modelAnswer,
    seniorReasoning: kase.senior_reasoning,
    questions,
    answers,
  });

  const fastModel =
    process.env.KIMI_CURRICULUM_MODEL?.trim() || "moonshot-v1-8k";
  const kimiOptions = {
    maxCompletionTokens: CURRICULUM_MAX_COMPLETION_TOKENS,
    temperature: 0,
  } as const;

  let raw: string;
  try {
    raw = await kimiChatJson({
      system,
      user,
      options: { ...kimiOptions, model: fastModel },
    });
  } catch (firstErr) {
    if (fastModel === "kimi-k2.6") throw firstErr;
    raw = await kimiChatJson({
      system,
      user,
      options: { ...kimiOptions, model: "kimi-k2.6" },
    });
  }
  let parsed: CurriculumEvaluation;
  try {
    parsed = CurriculumEvaluationSchema.parse(JSON.parse(raw));
  } catch (e) {
    throw new Error(
      `Failed to parse curriculum AI response: ${(e as Error).message}. Raw: ${raw.slice(0, 200)}`,
    );
  }

  const passedFinal =
    parsed.passed || parsed.overall_score >= CURRICULUM_PASS_SCORE;

  const fallback = parsed.overall_score;
  return {
    ...parsed,
    alignment_historical: parsed.alignment_historical ?? fallback,
    alignment_model: parsed.alignment_model ?? fallback,
    alignment_senior: parsed.alignment_senior ?? fallback,
    passedFinal,
  };
}
