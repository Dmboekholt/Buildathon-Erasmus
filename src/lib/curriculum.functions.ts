import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import {
  careerLevelLabel,
  careerLevelToCaseYear,
  CURRICULUM_LEVEL_UP_SCORE,
  CURRICULUM_MAX_LEVEL,
  CURRICULUM_ROLLING_WINDOW,
} from "@/config/curriculum-career";
import { CURRICULUM_PASS_SCORE } from "@/config/curriculum-scoring";
import { scoreCurriculumWithLlm } from "@/lib/curriculum-score";
import { isUuid } from "@/lib/slug";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Question = {
  id: string;
  prompt: string;
  guidance?: string;
};

function rollingAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  );
}

function computeLevelFromAttempts(
  currentLevel: number,
  recentScores: number[],
): number {
  if (currentLevel >= CURRICULUM_MAX_LEVEL) return currentLevel;
  const window = recentScores.slice(0, CURRICULUM_ROLLING_WINDOW);
  if (window.length < CURRICULUM_ROLLING_WINDOW) return currentLevel;
  const avg = rollingAverage(window);
  if (avg !== null && avg >= CURRICULUM_LEVEL_UP_SCORE) {
    return Math.min(currentLevel + 1, CURRICULUM_MAX_LEVEL);
  }
  return currentLevel;
}

const PRACTICE_AREA_KEYS = [
  "decision_making",
  "insights",
  "judgement",
] as const;

type PracticeAreaKey = (typeof PRACTICE_AREA_KEYS)[number];

const PRACTICE_AREA_LABELS: Record<PracticeAreaKey, string> = {
  decision_making: "Decision Making",
  insights: "Insights",
  judgement: "Judgement",
};

function monthLabel(d: Date): string {
  const m = d.toLocaleDateString("en-GB", { month: "short" });
  const y = String(d.getFullYear()).slice(-2);
  return `${m} '${y}`;
}

function attemptPassed(
  score: number,
  feedback: string | null,
): boolean {
  let passed = score >= CURRICULUM_PASS_SCORE;
  if (feedback) {
    try {
      const fb = JSON.parse(feedback) as { passed?: boolean };
      if (fb.passed === true) passed = true;
    } catch {
      /* ignore */
    }
  }
  return passed;
}

function buildProgressOverTime(
  attempts: {
    case_id: string;
    accuracy_score: number | null;
    feedback: string | null;
    created_at: string;
  }[],
  totalAssignments: number,
): { label: string; pct: number }[] {
  const now = new Date();
  const monthStarts: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  const firstPass = new Map<string, Date>();
  const sorted = [...attempts].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const alreadyPassed = new Set<string>();

  for (const a of sorted) {
    if (alreadyPassed.has(a.case_id)) continue;
    if (attemptPassed(a.accuracy_score ?? 0, a.feedback)) {
      alreadyPassed.add(a.case_id);
      firstPass.set(a.case_id, new Date(a.created_at));
    }
  }

  return monthStarts.map((monthStart) => {
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    let passed = 0;
    for (const date of firstPass.values()) {
      if (date <= monthEnd) passed++;
    }
    const pct =
      totalAssignments > 0
        ? Math.round((passed / totalAssignments) * 100)
        : 0;
    return { label: monthLabel(monthStart), pct };
  });
}

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
    z.object({ analystId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const [casesRes, progressRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("curriculum_cases")
        .select(
          "id, slug, title, era, industry, source, junior_year, difficulty, sort_order, learning_objective",
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

    if (casesRes.error) throw new Error(casesRes.error.message);
    if (progressRes.error) throw new Error(progressRes.error.message);
    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const level = progressRes.data?.level ?? 1;
    const caseYear = careerLevelToCaseYear(level);

    const bestByCase = new Map<
      string,
      { score: number; passed: boolean }
    >();
    const recentScores: number[] = [];
    for (const a of attemptsRes.data ?? []) {
      const score = a.accuracy_score ?? 0;
      if (recentScores.length < CURRICULUM_ROLLING_WINDOW) {
        recentScores.push(score);
      }
      const prev = bestByCase.get(a.case_id);
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
    const filtered = allCases.filter((c) => c.junior_year === caseYear);
    const rollingAvg = rollingAverage(recentScores);
    const attemptsInWindow = recentScores.length;

    return {
      level,
      levelLabel: careerLevelLabel(level),
      caseYear,
      rollingWindow: {
        size: CURRICULUM_ROLLING_WINDOW,
        attempts: attemptsInWindow,
        average: rollingAvg,
        target: CURRICULUM_LEVEL_UP_SCORE,
        readyToAdvance:
          level < CURRICULUM_MAX_LEVEL &&
          attemptsInWindow >= CURRICULUM_ROLLING_WINDOW &&
          rollingAvg !== null &&
          rollingAvg >= CURRICULUM_LEVEL_UP_SCORE,
      },
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
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("curriculum_cases").select("*");
    query = isUuid(data.slug)
      ? query.eq("id", data.slug)
      : query.eq("slug", data.slug);
    const { data: row, error } = await query.maybeSingle();
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
        ai_answer: row.ai_answer,
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
      alignment_historical: evaluation.alignment_historical,
      alignment_ai: evaluation.alignment_model,
      alignment_senior: evaluation.alignment_senior,
      feedback: JSON.stringify(feedbackPayload),
      skill_indicators: evaluation.skill_indicators,
    });
    if (insertErr) throw new Error(insertErr.message);

    const { data: recentAttempts } = await supabaseAdmin
      .from("curriculum_attempts")
      .select("accuracy_score")
      .eq("analyst_id", data.analystId)
      .order("created_at", { ascending: false })
      .limit(CURRICULUM_ROLLING_WINDOW);

    const recentScores = (recentAttempts ?? []).map(
      (a) => a.accuracy_score ?? 0,
    );
    const nextLevel = computeLevelFromAttempts(currentLevel, recentScores);

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

    const modelAnswer =
      row.ai_answer?.trim() || row.historical_answer?.trim() || "";

    return {
      accuracy,
      passed: evaluation.passedFinal,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      skillIndicators: evaluation.skill_indicators,
      alignmentHistorical: evaluation.alignment_historical,
      alignmentModel: evaluation.alignment_model,
      alignmentSenior: evaluation.alignment_senior,
      perQuestion,
      questions,
      level: nextLevel,
      levelLabel: careerLevelLabel(nextLevel),
      leveledUp: nextLevel > currentLevel,
      comparison: {
        historicalOutcome: row.historical_answer,
        modelAnswer,
        seniorReasoning: row.senior_reasoning,
      },
    };
  });

export const getPracticeDashboard = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ analystId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const [progressRes, casesRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("curriculum_progress")
        .select("level")
        .eq("analyst_id", data.analystId)
        .maybeSingle(),
      supabaseAdmin
        .from("curriculum_cases")
        .select("id, title, junior_year, sort_order, practice_area")
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

    if (progressRes.error) throw new Error(progressRes.error.message);
    if (casesRes.error) throw new Error(casesRes.error.message);
    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const level = progressRes.data?.level ?? 1;
    const filterYear = careerLevelToCaseYear(level);
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
      const rawArea = (c as { practice_area?: string }).practice_area;
      const practiceArea = PRACTICE_AREA_KEYS.includes(
        rawArea as PracticeAreaKey,
      )
        ? (rawArea as PracticeAreaKey)
        : "decision_making";
      return {
        id: c.id,
        title: c.title,
        juniorYear: c.junior_year as number,
        sortOrder: c.sort_order as number,
        practiceArea,
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

    const byPracticeArea = PRACTICE_AREA_KEYS.map((area) => {
      const areaCases = assignments.filter((a) => a.practiceArea === area);
      const passed = areaCases.filter((a) => a.status === "passed").length;
      const total = areaCases.length;
      return {
        area,
        label: PRACTICE_AREA_LABELS[area],
        passed,
        total,
        pct: total > 0 ? Math.round((passed / total) * 100) : 0,
      };
    });

    const progressOverTime = buildProgressOverTime(
      attemptsRes.data ?? [],
      totalAssignments,
    );

    return {
      level,
      levelLabel: careerLevelLabel(level),
      filterCaseYear: filterYear,
      totalAssignments,
      passedCount,
      byYear,
      byPracticeArea,
      progressOverTime,
      allAssignments: assignments,
      assignments: assignments.filter((a) => a.juniorYear === filterYear),
      learned: [...learnedSet].slice(0, 30),
      focusNext: needsWork.slice(0, 4),
    };
  });
