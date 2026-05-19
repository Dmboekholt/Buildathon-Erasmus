import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getScoringPrompt,
  SCORING_RUBRIC_VERSION,
} from "@/config/scoring";

const PRIORITY_ORDER = ["Low", "Medium", "High"] as const;
type Priority = (typeof PRIORITY_ORDER)[number];

function bumpPriority(current: string, direction: "raise" | "lower"): Priority {
  const idx = PRIORITY_ORDER.indexOf(current as Priority);
  if (idx < 0) return "Medium";
  const next =
    direction === "raise"
      ? Math.min(PRIORITY_ORDER.length - 1, idx + 1)
      : Math.max(0, idx - 1);
  return PRIORITY_ORDER[next];
}

export const listImprovements = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ juniorId: z.string().uuid() }).parse(input),
  )
  .handler(async () => {
    const { data: rows, error } = await supabaseAdmin
      .from("improvements")
      .select("id, title, area, category, priority, status, updated_at")
      .eq("status", "open")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveDebrief = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        caseId: z.string().uuid(),
        transcript: z.string().min(1).max(200_000),
        juniorId: z.string().uuid(),
        projectId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("debriefs")
      .insert({
        case_id: data.caseId,
        transcript: data.transcript,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

const EvaluationSchema = z.object({
  overall_score: z.number().min(0).max(10),
  decision_making_score: z.number().min(0).max(10),
  insights_score: z.number().min(0).max(10),
  judgement_score: z.number().min(0).max(10),
  strengths: z.array(z.string()).max(10),
  gaps: z.array(z.string()).max(10),
  summary: z.string().max(2000),
  improvement_updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        action: z.enum(["lower", "raise", "keep", "resolve"]),
        reason: z.string().max(500).optional(),
      }),
    )
    .max(20),
  new_improvements: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        area: z.string().min(1).max(100),
        category: z.enum(["Decision Making", "Insights", "Judgement"]),
        priority: z.enum(["High", "Medium", "Low"]),
      }),
    )
    .max(10),
});

export type EvaluationResult = z.infer<typeof EvaluationSchema> & {
  applied: {
    updated: { id: string; from: string; to: string; action: string }[];
    inserted: number;
  };
};

export const scoreDebrief = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ debriefId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<EvaluationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const { data: debrief, error: dErr } = await supabaseAdmin
      .from("debriefs")
      .select("id, transcript, case_id, junior_id, project_id")
      .eq("id", data.debriefId)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!debrief) throw new Error("Debrief not found");

    let caseContext: unknown = null;
    if (debrief.case_id) {
      const { data: c } = await supabaseAdmin
        .from("cases")
        .select("title, company, industry, metadata")
        .eq("id", debrief.case_id)
        .maybeSingle();
      caseContext = c;
    }

    const improvementsQuery = supabaseAdmin
      .from("improvements")
      .select("id, title, area, category, priority")
      .eq("status", "open");
    if (debrief.junior_id) {
      improvementsQuery.eq("junior_id", debrief.junior_id);
    }
    const { data: existing, error: iErr } = await improvementsQuery;
    if (iErr) throw new Error(iErr.message);

    const { system, user } = getScoringPrompt({
      case: caseContext,
      existingImprovements: existing ?? [],
      transcript: debrief.transcript ?? "",
    });

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429)
        throw new Error("Rate limit reached. Please try again shortly.");
      if (aiRes.status === 402)
        throw new Error(
          "AI credits exhausted. Add credits in Workspace settings.",
        );
      throw new Error(`AI gateway error ${aiRes.status}: ${text.slice(0, 200)}`);
    }

    const aiJson = (await aiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: z.infer<typeof EvaluationSchema>;
    try {
      parsed = EvaluationSchema.parse(JSON.parse(raw));
    } catch (e) {
      throw new Error(
        `Failed to parse AI response: ${(e as Error).message}. Raw: ${raw.slice(0, 200)}`,
      );
    }

    const existingById = new Map((existing ?? []).map((r) => [r.id, r]));
    const updated: {
      id: string;
      from: string;
      to: string;
      action: string;
    }[] = [];

    for (const upd of parsed.improvement_updates) {
      const row = existingById.get(upd.id);
      if (!row) continue;
      if (upd.action === "keep") continue;
      if (upd.action === "resolve") {
        const { error } = await supabaseAdmin
          .from("improvements")
          .update({ status: "resolved", source_debrief_id: data.debriefId })
          .eq("id", upd.id);
        if (!error)
          updated.push({
            id: upd.id,
            from: row.priority,
            to: "resolved",
            action: upd.action,
          });
        continue;
      }
      const nextPriority = bumpPriority(row.priority, upd.action);
      if (nextPriority === row.priority) continue;
      const { error } = await supabaseAdmin
        .from("improvements")
        .update({
          priority: nextPriority,
          source_debrief_id: data.debriefId,
        })
        .eq("id", upd.id);
      if (!error)
        updated.push({
          id: upd.id,
          from: row.priority,
          to: nextPriority,
          action: upd.action,
        });
    }

    let inserted = 0;
    if (parsed.new_improvements.length > 0) {
      const rows = parsed.new_improvements.map((n) => ({
        title: n.title,
        area: n.area,
        category: n.category,
        priority: n.priority,
        source_debrief_id: data.debriefId,
        junior_id: debrief.junior_id,
      }));
      const { error, count } = await supabaseAdmin
        .from("improvements")
        .insert(rows, { count: "exact" });
      if (!error) inserted = count ?? rows.length;
    }

    const evaluation = {
      overall_score: parsed.overall_score,
      decision_making_score: parsed.decision_making_score,
      insights_score: parsed.insights_score,
      judgement_score: parsed.judgement_score,
      strengths: parsed.strengths,
      gaps: parsed.gaps,
      summary: parsed.summary,
    };

    await supabaseAdmin
      .from("debriefs")
      .update({
        status: "scored",
        completed_at: new Date().toISOString(),
        evaluation_json: evaluation,
        improvement_items: {
          updates: parsed.improvement_updates,
          new: parsed.new_improvements,
        },
      })
      .eq("id", data.debriefId);

    if (debrief.junior_id) {
      await supabaseAdmin.from("score_snapshots").insert({
        debrief_id: data.debriefId,
        junior_id: debrief.junior_id,
        project_id: debrief.project_id,
        overall_score: parsed.overall_score,
        decision_making_score: parsed.decision_making_score,
        insights_score: parsed.insights_score,
        judgement_score: parsed.judgement_score,
        rubric_version: SCORING_RUBRIC_VERSION,
      });
    }

    return {
      ...parsed,
      applied: { updated, inserted },
    };
  });
