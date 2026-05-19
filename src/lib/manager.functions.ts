import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ManagerProject = { id: string; name: string; sector: string | null };

function trend(
  recent: number | null,
  prior: number | null,
): "up" | "down" | "flat" | null {
  if (recent == null || prior == null) return null;
  if (recent > prior) return "up";
  if (recent < prior) return "down";
  return "flat";
}

export const listManagers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, sector")
    .eq("role", "manager")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
    sector: r.sector,
  }));
});

export const listManagerProjects = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ managerId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<ManagerProject[]> => {
    const { data: rows, error } = await supabaseAdmin
      .from("project_members")
      .select("projects(id, name, sector)")
      .eq("profile_id", data.managerId)
      .eq("role", "manager");
    if (error) throw new Error(error.message);
    const projects: ManagerProject[] = [];
    for (const row of rows ?? []) {
      const p = row.projects as ManagerProject | null;
      if (p && !projects.some((x) => x.id === p.id)) projects.push(p);
    }
    return projects.sort((a, b) => a.name.localeCompare(b.name));
  });

export const listVisibleJuniors = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        managerId: z.string().min(1),
        projectId: z.string().min(1).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: projectRows, error: pErr } = await supabaseAdmin
      .from("project_members")
      .select("project_id, profile_id, role, projects(id, name, sector)")
      .eq("role", "junior");
    if (pErr) throw new Error(pErr.message);

    const { data: teamRows, error: tErr } = await supabaseAdmin
      .from("teams")
      .select("id, team_members(profile_id)")
      .eq("manager_id", data.managerId);
    if (tErr) throw new Error(tErr.message);

    const teamJuniorIds = new Set<string>();
    for (const team of teamRows ?? []) {
      for (const m of team.team_members ?? []) {
        if (m.profile_id) teamJuniorIds.add(m.profile_id);
      }
    }

    const { data: mgrProjects, error: mpErr } = await supabaseAdmin
      .from("project_members")
      .select("project_id")
      .eq("profile_id", data.managerId)
      .eq("role", "manager");
    if (mpErr) throw new Error(mpErr.message);

    const managerProjectIds = new Set(
      (mgrProjects ?? []).map((r) => r.project_id as string),
    );
    if (data.projectId) {
      if (!managerProjectIds.has(data.projectId)) {
        for (const id of teamJuniorIds) managerProjectIds.add(data.projectId);
      }
    }

    const juniorIds = new Set<string>();
    const projectsByJunior = new Map<string, ManagerProject[]>();

    for (const row of projectRows ?? []) {
      if (!managerProjectIds.has(row.project_id)) continue;
      if (data.projectId && row.project_id !== data.projectId) continue;

      juniorIds.add(row.profile_id);
      const p = row.projects as ManagerProject | null;
      if (p) {
        const list = projectsByJunior.get(row.profile_id) ?? [];
        if (!list.some((x) => x.id === p.id)) list.push(p);
        projectsByJunior.set(row.profile_id, list);
      }
    }

    for (const id of teamJuniorIds) juniorIds.add(id);

    if (juniorIds.size === 0) return [];

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, sector")
      .in("id", [...juniorIds])
      .eq("role", "junior");
    if (profErr) throw new Error(profErr.message);

    const { data: snapshots, error: sErr } = await supabaseAdmin
      .from("score_snapshots")
      .select(
        "junior_id, scored_at, overall_score, decision_making_score, insights_score, judgement_score",
      )
      .in("junior_id", [...juniorIds])
      .order("scored_at", { ascending: false });
    if (sErr) throw new Error(sErr.message);

    const byJunior = new Map<string, typeof snapshots>();
    for (const s of snapshots ?? []) {
      const list = byJunior.get(s.junior_id) ?? [];
      list.push(s);
      byJunior.set(s.junior_id, list);
    }

    return (profiles ?? []).map((j) => {
      const snaps = byJunior.get(j.id) ?? [];
      const latest = snaps[0];
      const prior = snaps[1];
      return {
        id: j.id,
        full_name: j.full_name,
        sector: j.sector,
        projects: projectsByJunior.get(j.id) ?? [],
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
            prior ? Number(prior.overall_score) : null,
          ),
          decision_making: trend(
            latest ? Number(latest.decision_making_score) : null,
            prior ? Number(prior.decision_making_score) : null,
          ),
          insights: trend(
            latest ? Number(latest.insights_score) : null,
            prior ? Number(prior.insights_score) : null,
          ),
          judgement: trend(
            latest ? Number(latest.judgement_score) : null,
            prior ? Number(prior.judgement_score) : null,
          ),
        },
      };
    });
  });

export const getJuniorProgress = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        managerId: z.string().min(1),
        juniorId: z.string().min(1),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, sector")
      .eq("id", data.juniorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw notFound();

    const { data: memberRows } = await supabaseAdmin
      .from("project_members")
      .select("projects(id, name, sector)")
      .eq("profile_id", data.juniorId)
      .eq("role", "junior");

    const projects: ManagerProject[] = [];
    for (const row of memberRows ?? []) {
      const p = row.projects as ManagerProject | null;
      if (p && !projects.some((x) => x.id === p.id)) projects.push(p);
    }

    let snapQuery = supabaseAdmin
      .from("score_snapshots")
      .select(
        "id, scored_at, overall_score, decision_making_score, insights_score, judgement_score, project_id",
      )
      .eq("junior_id", data.juniorId)
      .order("scored_at", { ascending: true });
    if (data.from) snapQuery = snapQuery.gte("scored_at", data.from);
    if (data.to) snapQuery = snapQuery.lte("scored_at", data.to);
    const { data: snapshots, error: sErr } = await snapQuery;
    if (sErr) throw new Error(sErr.message);

    const { data: debriefRows, error: dErr } = await supabaseAdmin
      .from("debriefs")
      .select("id, completed_at, evaluation_json, cases(title)")
      .eq("junior_id", data.juniorId)
      .eq("status", "scored")
      .order("completed_at", { ascending: false })
      .limit(20);
    if (dErr) throw new Error(dErr.message);

    const debriefs = (debriefRows ?? []).map((d) => {
      const ev = d.evaluation_json as Record<string, number> | null;
      const caseRow = d.cases as { title: string } | null;
      return {
        id: d.id,
        completed_at: d.completed_at,
        case_title: caseRow?.title ?? "Case review",
        overall_score: ev?.overall_score ?? null,
        decision_making_score: ev?.decision_making_score ?? null,
        insights_score: ev?.insights_score ?? null,
        judgement_score: ev?.judgement_score ?? null,
      };
    });

    return {
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        sector: profile.sector,
      },
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
      debriefs,
    };
  });
