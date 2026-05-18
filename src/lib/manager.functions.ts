import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getVisibleJuniorIds(managerId: string): Promise<Set<string>> {
  const visible = new Set<string>();

  const { data: managedProjects } = await supabaseAdmin
    .from("project_members")
    .select("project_id")
    .eq("profile_id", managerId)
    .eq("role", "manager");

  const projectIds = (managedProjects ?? []).map((r) => r.project_id);
  if (projectIds.length > 0) {
    const { data: juniorsOnProjects } = await supabaseAdmin
      .from("project_members")
      .select("profile_id, project_id")
      .in("project_id", projectIds)
      .eq("role", "junior");

    for (const row of juniorsOnProjects ?? []) {
      const { data: managersOnProject } = await supabaseAdmin
        .from("project_members")
        .select("profile_id")
        .eq("project_id", row.project_id)
        .eq("role", "manager")
        .eq("profile_id", managerId);
      if ((managersOnProject ?? []).length > 0) {
        visible.add(row.profile_id);
      }
    }
  }

  const { data: teams } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("manager_id", managerId);

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length > 0) {
    const { data: teamJuniors } = await supabaseAdmin
      .from("team_members")
      .select("profile_id")
      .in("team_id", teamIds);
    for (const row of teamJuniors ?? []) {
      visible.add(row.profile_id);
    }
  }

  return visible;
}

function trend(
  latest: number | null,
  previous: number | null,
): "up" | "down" | "flat" | null {
  if (latest == null || previous == null) return null;
  if (latest > previous) return "up";
  if (latest < previous) return "down";
  return "flat";
}

async function getSharedProjects(managerId: string, juniorId: string) {
  const { data: managerRows } = await supabaseAdmin
    .from("project_members")
    .select("project_id")
    .eq("profile_id", managerId)
    .eq("role", "manager");
  const managerProjectIds = new Set(
    (managerRows ?? []).map((r) => r.project_id),
  );

  const { data: juniorRows } = await supabaseAdmin
    .from("project_members")
    .select("project_id, projects(id, name, sector)")
    .eq("profile_id", juniorId)
    .eq("role", "junior");

  return (juniorRows ?? [])
    .filter((r) => managerProjectIds.has(r.project_id))
    .map((r) => r.projects as { id: string; name: string; sector: string | null })
    .filter((p): p is { id: string; name: string; sector: string | null } => p != null);
}

export const listManagers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, sector")
    .eq("role", "manager")
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listManagerProjects = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ managerId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("project_members")
      .select("project_id, projects(id, name, sector)")
      .eq("profile_id", data.managerId)
      .eq("role", "manager");
    if (error) throw new Error(error.message);
    return (rows ?? [])
      .map((r) => r.projects as { id: string; name: string; sector: string | null } | null)
      .filter((p): p is { id: string; name: string; sector: string | null } => p != null);
  });

export const listVisibleJuniors = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        managerId: z.string().uuid(),
        projectId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const visibleIds = await getVisibleJuniorIds(data.managerId);
    if (visibleIds.size === 0) return [];

    const { data: juniors, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, sector")
      .in("id", [...visibleIds])
      .eq("role", "junior")
      .order("full_name");
    if (error) throw new Error(error.message);

    const results = [];
    for (const junior of juniors ?? []) {
      const sharedWithManager = await getSharedProjects(data.managerId, junior.id);
      if (sharedWithManager.length === 0 && !visibleIds.has(junior.id)) continue;
      if (data.projectId && !sharedWithManager.some((p) => p.id === data.projectId)) {
        continue;
      }

      let snapQuery = supabaseAdmin
        .from("score_snapshots")
        .select("*")
        .eq("junior_id", junior.id)
        .order("scored_at", { ascending: false });
      if (data.projectId) {
        snapQuery = snapQuery.eq("project_id", data.projectId);
      }
      const { data: snaps } = await snapQuery.limit(2);

      const latest = snaps?.[0];
      const previous = snaps?.[1];

      results.push({
        id: junior.id,
        full_name: junior.full_name,
        sector: junior.sector,
        projects: sharedWithManager,
        last_review_at: latest?.scored_at ?? null,
        latest: latest
          ? {
              overall: Number(latest.overall_score),
              decision_making: Number(latest.decision_making_score),
              insights: Number(latest.insights_score),
              judgement: Number(latest.judgement_score),
            }
          : null,
        trends: {
          overall: trend(
            latest ? Number(latest.overall_score) : null,
            previous ? Number(previous.overall_score) : null,
          ),
          decision_making: trend(
            latest ? Number(latest.decision_making_score) : null,
            previous ? Number(previous.decision_making_score) : null,
          ),
          insights: trend(
            latest ? Number(latest.insights_score) : null,
            previous ? Number(previous.insights_score) : null,
          ),
          judgement: trend(
            latest ? Number(latest.judgement_score) : null,
            previous ? Number(previous.judgement_score) : null,
          ),
        },
      });
    }

    return results;
  });

export const getJuniorProgress = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        managerId: z.string().uuid(),
        juniorId: z.string().uuid(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const visible = await getVisibleJuniorIds(data.managerId);
    if (!visible.has(data.juniorId)) throw notFound();

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, sector")
      .eq("id", data.juniorId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw notFound();

    let snapQuery = supabaseAdmin
      .from("score_snapshots")
      .select("*")
      .eq("junior_id", data.juniorId)
      .order("scored_at", { ascending: true });
    if (data.from) snapQuery = snapQuery.gte("scored_at", data.from);
    if (data.to) snapQuery = snapQuery.lte("scored_at", data.to);
    const { data: snapshots, error: sErr } = await snapQuery;
    if (sErr) throw new Error(sErr.message);

    const projects = await getSharedProjects(data.managerId, data.juniorId);

    const { data: debriefs } = await supabaseAdmin
      .from("debriefs")
      .select("id, completed_at, case_id, evaluation_json")
      .eq("junior_id", data.juniorId)
      .eq("status", "scored")
      .order("completed_at", { ascending: false })
      .limit(20);

    const caseIds = [...new Set((debriefs ?? []).map((d) => d.case_id).filter(Boolean))] as string[];
    const caseTitles = new Map<string, string>();
    if (caseIds.length > 0) {
      const { data: cases } = await supabaseAdmin
        .from("cases")
        .select("id, title")
        .in("id", caseIds);
      for (const c of cases ?? []) {
        caseTitles.set(c.id, c.title);
      }
    }

    return {
      profile,
      projects,
      snapshots: (snapshots ?? []).map((s) => ({
        id: s.id,
        scored_at: s.scored_at,
        overall_score: Number(s.overall_score),
        decision_making_score: Number(s.decision_making_score),
        insights_score: Number(s.insights_score),
        judgement_score: Number(s.judgement_score),
        project_id: s.project_id,
      })),
      debriefs: (debriefs ?? []).map((d) => {
        const ev = d.evaluation_json as {
          overall_score?: number;
          decision_making_score?: number;
          insights_score?: number;
          judgement_score?: number;
        } | null;
        return {
          id: d.id,
          completed_at: d.completed_at,
          case_title: d.case_id ? (caseTitles.get(d.case_id) ?? "Case review") : "Case review",
          overall_score: ev?.overall_score ?? null,
          decision_making_score: ev?.decision_making_score ?? null,
          insights_score: ev?.insights_score ?? null,
          judgement_score: ev?.judgement_score ?? null,
        };
      }),
    };
  });
