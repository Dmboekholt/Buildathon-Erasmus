import { z } from "zod";
import {
  CURRICULUM_PASS_SCORE,
  getCurriculumScoringPrompt,
} from "@/config/curriculum-scoring";
import { kimiChatJson } from "@/lib/kimi";

export const CurriculumEvaluationSchema = z.object({
  overall_score: z.number().min(0).max(100),
  passed: z.boolean(),
  summary: z.string().max(3000),
  strengths: z.array(z.string()).max(15),
  gaps: z.array(z.string()).max(15),
  skill_indicators: z.array(z.string()).max(20),
  per_question: z
    .array(
      z.object({
        question_id: z.string(),
        score: z.number().min(0).max(100),
        feedback: z.string().max(2000),
        demonstrated: z.array(z.string()).max(15),
        missing: z.array(z.string()).max(15),
      }),
    )
    .max(10),
});

export type CurriculumEvaluation = z.infer<typeof CurriculumEvaluationSchema>;

export type CurriculumCaseForScoring = {
  title: string;
  case_text: string;
  learning_objective?: string | null;
  expected_insights: string[] | null;
  historical_answer: string;
  senior_reasoning: string;
  questions: { id: string; prompt: string; guidance?: string }[] | null;
};

export async function scoreCurriculumWithLlm(
  kase: CurriculumCaseForScoring,
  answers: { questionId: string; answer: string }[],
): Promise<CurriculumEvaluation & { passedFinal: boolean }> {
  const questions = kase.questions ?? [];
  const { system, user } = getCurriculumScoringPrompt({
    title: kase.title,
    learningObjective: kase.learning_objective?.trim() || "",
    caseText: kase.case_text,
    expectedInsights: kase.expected_insights ?? [],
    historicalAnswer: kase.historical_answer,
    seniorReasoning: kase.senior_reasoning,
    questions,
    answers,
  });

  const raw = await kimiChatJson({ system, user });
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

  return { ...parsed, passedFinal };
}
