import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Question = {
  id: string;
  prompt: string;
  guidance?: string;
};

export const listCurriculum = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ analystId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const [casesRes, progressRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("curriculum_cases")
        .select("id, title, era, industry, difficulty, source")
        .order("difficulty", { ascending: true }),
      supabaseAdmin
        .from("curriculum_progress")
        .select("level")
        .eq("analyst_id", data.analystId)
        .maybeSingle(),
      supabaseAdmin
        .from("curriculum_attempts")
        .select("case_id, accuracy_score, created_at")
        .eq("analyst_id", data.analystId)
        .order("created_at", { ascending: false }),
    ]);

    if (casesRes.error) throw new Error(casesRes.error.message);
    if (progressRes.error) throw new Error(progressRes.error.message);
    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const bestByCase = new Map<string, number>();
    for (const a of attemptsRes.data ?? []) {
      const prev = bestByCase.get(a.case_id) ?? 0;
      if ((a.accuracy_score ?? 0) > prev) bestByCase.set(a.case_id, a.accuracy_score ?? 0);
    }

    return {
      level: progressRes.data?.level ?? 1,
      cases: (casesRes.data ?? []).map((c) => ({
        ...c,
        bestScore: bestByCase.get(c.id) ?? null,
      })),
    };
  });

export const getCurriculumCase = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("curriculum_cases")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw notFound();
    return row;
  });

function scoreAnswer(answer: string, expected: string[]): number {
  if (!answer.trim() || expected.length === 0) return 0;
  const a = answer.toLowerCase();
  const hits = expected.filter((kw) => {
    const tokens = kw.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    if (tokens.length === 0) return a.includes(kw.toLowerCase());
    return tokens.some((t) => a.includes(t));
  });
  const ratio = hits.length / expected.length;
  const lengthBonus = Math.min(1, answer.split(/\s+/).length / 60);
  return Math.round(Math.min(100, ratio * 80 + lengthBonus * 20));
}

export const submitCurriculumAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        analystId: z.string(),
        caseId: z.string().uuid(),
        answers: z.array(z.object({ questionId: z.string(), answer: z.string() })),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("curriculum_cases")
      .select("expected_insights, questions, difficulty")
      .eq("id", data.caseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw notFound();

    const expected: string[] = (row.expected_insights as string[] | null) ?? [];
    const questions: Question[] = (row.questions as Question[] | null) ?? [];

    const perQuestion = data.answers.map((a) => ({
      questionId: a.questionId,
      score: scoreAnswer(a.answer, expected),
    }));
    const accuracy =
      perQuestion.length === 0
        ? 0
        : Math.round(perQuestion.reduce((s, p) => s + p.score, 0) / perQuestion.length);

    const { data: progress } = await supabaseAdmin
      .from("curriculum_progress")
      .select("level")
      .eq("analyst_id", data.analystId)
      .maybeSingle();
    const currentLevel = progress?.level ?? 1;

    const { error: insertErr } = await supabaseAdmin.from("curriculum_attempts").insert({
      analyst_id: data.analystId,
      case_id: data.caseId,
      analyst_level: currentLevel,
      written_insight: data.answers.map((a) => a.answer).join("\n\n"),
      answers: data.answers,
      per_question_scores: perQuestion,
      accuracy_score: accuracy,
    });
    if (insertErr) throw new Error(insertErr.message);

    let nextLevel = currentLevel;
    if (accuracy >= 80 && currentLevel < 10) nextLevel = currentLevel + 1;
    if (progress) {
      await supabaseAdmin
        .from("curriculum_progress")
        .update({ level: nextLevel, updated_at: new Date().toISOString() })
        .eq("analyst_id", data.analystId);
    } else {
      await supabaseAdmin
        .from("curriculum_progress")
        .insert({ analyst_id: data.analystId, level: nextLevel });
    }

    return {
      accuracy,
      perQuestion,
      questions,
      level: nextLevel,
      leveledUp: nextLevel > currentLevel,
    };
  });
