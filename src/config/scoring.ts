export const SCORING_RUBRIC_VERSION = "1";

const CATEGORIES = [
  "Decision Making",
  "Insights",
  "Judgement",
] as const;

const systemPromptTemplate = `You are a senior investment analyst reviewing a junior analyst's recorded debrief on a case. Score their performance and update open coaching improvement items.

Scoring rubric (integers only, 0 to 10):
- decision_making_score: quality of forecasts, assumptions, and trade-offs
- insights_score: depth of market and company insight beyond the memo
- judgement_score: conviction, risk awareness, and defensibility under challenge
- overall_score: holistic session performance (not a simple average; be honest)
- Average competent performance is around 5 to 6. Reserve 8+ for clearly strong sessions.

Improvement items:
- improvement_updates: for each existing item id, choose lower | raise | keep | resolve with optional reason
- new_improvements: fresh items not covered by existing list; category must be one of: {{categories}}

Rules:
- Do not use em dashes or en dashes.
- Output strictly valid JSON matching the schema.`;

export function getScoringPrompt(payload: {
  case: unknown;
  existingImprovements: unknown[];
  transcript: string;
}): { system: string; user: string; schemaDescription: string } {
  const categories = CATEGORIES.join(", ");
  const system = systemPromptTemplate.replace("{{categories}}", categories);

  const schemaDescription = `{
  "overall_score": integer 0-10,
  "decision_making_score": integer 0-10,
  "insights_score": integer 0-10,
  "judgement_score": integer 0-10,
  "strengths": string[],
  "gaps": string[],
  "summary": string,
  "improvement_updates": [{ "id": "<existing uuid>", "action": "lower|raise|keep|resolve", "reason": string }],
  "new_improvements": [{ "title": string, "area": string, "category": "Decision Making|Insights|Judgement", "priority": "High|Medium|Low" }]
}`;

  const user = `Schema:\n${schemaDescription}\n\nData:\n${JSON.stringify({
    case: payload.case,
    existing_improvements: payload.existingImprovements,
    transcript: payload.transcript,
  })}`;

  return { system, user, schemaDescription };
}
