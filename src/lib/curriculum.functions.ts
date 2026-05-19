import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { CURRICULUM_PASS_SCORE } from "@/config/curriculum-scoring";
import { scoreCurriculumWithLlm } from "@/lib/curriculum-score";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Question = {
  id: string;
  prompt: string;
  guidance?: string;
};

const juniorYearSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

function deriveStatus(
  bestScore: number | null,
  passed: boolean,
): "not_started" | "in_progress" | "passed" {
  if (passed || (bestScore !== null && bestScore >= CURRICULUM_PASS_SCORE))
    return "passed";
  if (bestScore !== null) return "in_progress";
  return "not_started";
}

export const listCurriculum = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        analystId: z.string(),
        juniorYear: juniorYearSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const [profileRes, casesRes, progressRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("junior_year")
        .eq("id", data.analystId)
        .maybeSingle(),
      supabaseAdmin
        .from("curriculum_cases")
        .select(
          "id, title, era, industry, source, junior_year, sort_order, learning_objective",
        )
        .order("junior_year", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("curriculum_progress")
        .select("level")
        .eq("analyst_id", data.analystId)
        .maybeSingle(),
      supabaseAdmin
        .from("curriculum_attempts")
        .select("case_id, accuracy_score, feedback, created_at")
        .eq("analyst_id", data.analystId)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (casesRes.error) throw new Error(casesRes.error.message);
    if (progressRes.error) throw new Error(progressRes.error.message);
    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const profileYear = (profileRes.data?.junior_year ?? 1) as 1 | 2 | 3;
    const filterYear = data.juniorYear ?? profileYear;

    const bestByCase = new Map<
      string,
      { score: number; passed: boolean }
    >();
    for (const a of attemptsRes.data ?? []) {
      const prev = bestByCase.get(a.case_id);
      const score = a.accuracy_score ?? 0;
      let passed = score >= CURRICULUM_PASS_SCORE;
      if (a.feedback) {
        try {
          const fb = JSON.parse(a.feedback) as { passed?: boolean };
          if (fb.passed === true) passed = true;
        } catch {
          /* ignore */
        }
      }
      if (!prev || score > prev.score) {
        bestByCase.set(a.case_id, { score, passed });
      }
    }

    const allCases = casesRes.data ?? [];
    const filtered = allCases.filter((c) => c.junior_year === filterYear);

    return {
      level: progressRes.data?.level ?? 1,
      profileJuniorYear: profileYear,
      filterJuniorYear: filterYear,
      cases: filtered.map((c) => {
        const best = bestByCase.get(c.id);
        const bestScore = best?.score ?? null;
        return {
          ...c,
          bestScore,
          status: deriveStatus(bestScore, best?.passed ?? false),
        };
      }),
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
      .select("*")
      .eq("id", data.caseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw notFound();

    const questions: Question[] = (row.questions as Question[] | null) ?? [];

    const evaluation = await scoreCurriculumWithLlm(
      {
        title: row.title,
        case_text: row.case_text,
        learning_objective: row.learning_objective,
        expected_insights: row.expected_insights,
        historical_answer: row.historical_answer,
        senior_reasoning: row.senior_reasoning,
        questions,
      },
      data.answers,
    );

    const perQuestion = evaluation.per_question.map((pq) => ({
      questionId: pq.question_id,
      score: pq.score,
      feedback: pq.feedback,
      demonstrated: pq.demonstrated,
      missing: pq.missing,
    }));

    const accuracy = evaluation.overall_score;
    const feedbackPayload = {
      passed: evaluation.passedFinal,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
    };

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
      feedback: JSON.stringify(feedbackPayload),
      skill_indicators: evaluation.skill_indicators,
    });
    if (insertErr) throw new Error(insertErr.message);

    let nextLevel = currentLevel;
    if (evaluation.passedFinal && currentLevel < 10) nextLevel = currentLevel + 1;
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
      passed: evaluation.passedFinal,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      skillIndicators: evaluation.skill_indicators,
      perQuestion,
      questions,
      level: nextLevel,
      leveledUp: nextLevel > currentLevel,
    };
  });

export const getPracticeDashboard = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        analystId: z.string(),
        juniorYear: juniorYearSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const [profileRes, casesRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("junior_year")
        .eq("id", data.analystId)
        .maybeSingle(),
      supabaseAdmin
        .from("curriculum_cases")
        .select("id, title, junior_year, sort_order")
        .order("junior_year", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("curriculum_attempts")
        .select(
          "case_id, accuracy_score, feedback, skill_indicators, created_at",
        )
        .eq("analyst_id", data.analystId)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (casesRes.error) throw new Error(casesRes.error.message);
    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const profileYear = (profileRes.data?.junior_year ?? 1) as 1 | 2 | 3;
    const filterYear = data.juniorYear ?? profileYear;
    const allCases = casesRes.data ?? [];
    const totalAssignments = allCases.length;

    type AttemptMeta = {
      bestScore: number;
      passed: boolean;
      lastAttemptAt: string;
      gaps: string[];
      strengths: string[];
      skillIndicators: string[];
    };

    const byCase = new Map<string, AttemptMeta>();

    for (const a of attemptsRes.data ?? []) {
      const score = a.accuracy_score ?? 0;
      let passed = score >= CURRICULUM_PASS_SCORE;
      let gaps: string[] = [];
      let strengths: string[] = [];
      if (a.feedback) {
        try {
          const fb = JSON.parse(a.feedback) as {
            passed?: boolean;
            gaps?: string[];
            strengths?: string[];
          };
          if (fb.passed === true) passed = true;
          gaps = fb.gaps ?? [];
          strengths = fb.strengths ?? [];
        } catch {
          /* ignore */
        }
      }
      const skills = Array.isArray(a.skill_indicators)
        ? (a.skill_indicators as string[])
        : [];

      const prev = byCase.get(a.case_id);
      if (!prev || score >= prev.bestScore) {
        byCase.set(a.case_id, {
          bestScore: Math.max(score, prev?.bestScore ?? 0),
          passed: passed || (prev?.passed ?? false),
          lastAttemptAt: a.created_at,
          gaps,
          strengths,
          skillIndicators: skills,
        });
      } else if (prev) {
        byCase.set(a.case_id, {
          ...prev,
          passed: prev.passed || passed,
        });
      }
    }

    const assignments = allCases.map((c) => {
      const meta = byCase.get(c.id);
      const bestScore = meta?.bestScore ?? null;
      return {
        id: c.id,
        title: c.title,
        juniorYear: c.junior_year as number,
        sortOrder: c.sort_order as number,
        bestScore,
        status: deriveStatus(bestScore, meta?.passed ?? false),
        lastAttemptAt: meta?.lastAttemptAt ?? null,
        gaps: meta?.gaps ?? [],
      };
    });

    const passedCount = assignments.filter((a) => a.status === "passed").length;

    const learnedSet = new Set<string>();
    const needsWork: {
      id: string;
      title: string;
      juniorYear: number;
      sortOrder: number;
      bestScore: number | null;
      gaps: string[];
    }[] = [];

    for (const a of assignments) {
      const meta = byCase.get(a.id);
      if (a.status === "passed" && meta) {
        for (const s of meta.strengths) learnedSet.add(s);
        for (const s of meta.skillIndicators) learnedSet.add(s);
      }
      if (
        a.juniorYear === filterYear &&
        (a.status !== "passed" ||
          (a.bestScore !== null && a.bestScore < CURRICULUM_PASS_SCORE))
      ) {
        if (a.status !== "passed") {
          needsWork.push({
            id: a.id,
            title: a.title,
            juniorYear: a.juniorYear,
            sortOrder: a.sortOrder,
            bestScore: a.bestScore,
            gaps: a.gaps,
          });
        }
      }
    }

    needsWork.sort((a, b) => (a.bestScore ?? -1) - (b.bestScore ?? -1));

    const byYear = ([1, 2, 3] as const).map((year) => {
      const yearCases = assignments.filter((a) => a.juniorYear === year);
      const passed = yearCases.filter((a) => a.status === "passed").length;
      return { year, total: yearCases.length, passed };
    });

    return {
      profileJuniorYear: profileYear,
      filterJuniorYear: filterYear,
      totalAssignments,
      passedCount,
      byYear,
      assignments: assignments.filter((a) => a.juniorYear === filterYear),
      learned: [...learnedSet].slice(0, 30),
      focusNext: needsWork.slice(0, 4),
    };
  });
