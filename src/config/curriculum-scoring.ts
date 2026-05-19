export const CURRICULUM_PASS_SCORE = 70;

export const CURRICULUM_RUBRIC_VERSION = "1";

const systemPrompt = `You are a senior investment analyst grading a junior analyst's written answers on a training case.

Your job is to assess whether the junior actually understood the material, not whether they used specific keywords.

Scoring rules:
- overall_score and per-question score are integers from 0 to 100.
- passed is true only if the junior demonstrated the core learning objectives across their answers.
- Be fair but honest: empty, generic, or off-topic answers should score below 40.
- Strong answers that show reasoning, link facts to the case, and surface risks deserve 75+.
- Use expected_insights as rubric hints, not as a keyword checklist.
- Compare mentally to historical_answer and senior_reasoning when provided.
- feedback per question must be specific and actionable (2-4 sentences).
- demonstrated lists concepts the junior got right; missing lists what they should add.
- skill_indicators: 2-6 short tags for skills demonstrated (e.g. "working capital", "DSO").
- Do not use em dashes or en dashes.
- Output strictly valid JSON matching the schema.`;

export function getCurriculumScoringPrompt(payload: {
  title: string;
  learningObjective: string;
  caseText: string;
  expectedInsights: string[];
  historicalAnswer: string;
  seniorReasoning: string;
  questions: { id: string; prompt: string; guidance?: string }[];
  answers: { questionId: string; answer: string }[];
}): { system: string; user: string } {
  const schemaDescription = `{
  "overall_score": integer 0-100,
  "passed": boolean,
  "summary": string,
  "strengths": string[],
  "gaps": string[],
  "skill_indicators": string[],
  "per_question": [{
    "question_id": string,
    "score": integer 0-100,
    "feedback": string,
    "demonstrated": string[],
    "missing": string[]
  }]
}`;

  const user = `Schema:\n${schemaDescription}\n\nCase:\n${JSON.stringify({
    title: payload.title,
    learning_objective: payload.learningObjective,
    case_text: payload.caseText,
    expected_insights: payload.expectedInsights,
    historical_answer: payload.historicalAnswer,
    senior_reasoning: payload.seniorReasoning,
    questions: payload.questions,
    junior_answers: payload.answers,
  })}`;

  return { system: systemPrompt, user };
}
