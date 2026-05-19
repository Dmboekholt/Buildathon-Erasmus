/** Minimum score to count a case attempt as passed. */
export const CURRICULUM_PASS_SCORE = 70;

export const CURRICULUM_RUBRIC_VERSION = "2";

/** Cap model output for faster curriculum grading (JSON only). */
export const CURRICULUM_MAX_COMPLETION_TOKENS = 720;

const CASE_TEXT_MAX = 1_200;
const ANSWER_MAX = 1_500;

function trim(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const systemPrompt = `Grade analyst judgment on anonymized historical BDO training cases. Output JSON only.
Scores 0-100 integers. passed=true only if core objectives are met.
Empty or generic answers: below 40. Strong linked reasoning: 75+.
Compare the analyst answer to THREE references:
1) historical_outcome — what actually happened on the deal
2) model_answer — ideal reasoning path
3) senior_reasoning — experienced judgment, risk framing, decision logic
Set alignment_historical, alignment_model, alignment_senior (0-100) for how well the analyst matches each.
overall_score should reflect holistic judgment quality, not keyword matching.
skill_indicators: tag 2-6 from insight, risk awareness, pattern recognition, judgment quality (plus specifics).
Use expected_insights as rubric hints only.
Per-question feedback: max 2 short sentences.
strengths, gaps, skill_indicators, demonstrated, and missing must be JSON arrays of strings (use [] if none), never a single string.
No em dashes.`;

export function getCurriculumScoringPrompt(payload: {
  title: string;
  learningObjective: string;
  caseText: string;
  expectedInsights: string[];
  historicalOutcome: string;
  modelAnswer: string;
  seniorReasoning: string;
  questions: { id: string; prompt: string; guidance?: string }[];
  answers: { questionId: string; answer: string }[];
}): { system: string; user: string } {
  const user = JSON.stringify({
    schema: {
      overall_score: "0-100",
      passed: "boolean",
      summary: "1-2 sentences",
      alignment_historical: "0-100",
      alignment_model: "0-100",
      alignment_senior: "0-100",
      strengths: ["string array, never a string"],
      gaps: ["string array, never a string"],
      skill_indicators: ["string array, never a string"],
      per_question: [
        {
          question_id: "string",
          score: "0-100",
          feedback: "string",
          demonstrated: ["string array, never a string"],
          missing: ["string array, never a string"],
        },
      ],
    },
    title: payload.title,
    learning_objective: trim(payload.learningObjective, 400),
    case_text: trim(payload.caseText, CASE_TEXT_MAX),
    expected_insights: payload.expectedInsights.slice(0, 10),
    historical_outcome: trim(payload.historicalOutcome, 800),
    model_answer: trim(payload.modelAnswer, 800),
    senior_reasoning: trim(payload.seniorReasoning, 800),
    questions: payload.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
    })),
    analyst_answers: payload.answers.map((a) => ({
      question_id: a.questionId,
      answer: trim(a.answer, ANSWER_MAX),
    })),
  });

  return { system: systemPrompt, user };
}
