import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// NOTE: Manager features depend on tables (project_members, teams, team_members,
// score_snapshots) and columns (profiles.sector, debriefs.junior_id, etc.) that
// are not present in the current schema. These functions return safe empty
// shapes so the rest of the app continues to build and render.

type ManagerProject = { id: string; name: string; sector: string | null };

export const listManagers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "manager")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, full_name: r.full_name, sector: null as string | null }));
});

export const listManagerProjects = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ managerId: z.string().uuid() }).parse(input))
  .handler(async (): Promise<ManagerProject[]> => {
    return [];
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
  .handler(async () => {
    return [] as Array<{
      id: string;
      full_name: string;
      sector: string | null;
      projects: ManagerProject[];
      last_review_at: string | null;
      latest: {
        overall: number;
        decision_making: number;
        insights: number;
        judgement: number;
      } | null;
      trends: {
        overall: "up" | "down" | "flat" | null;
        decision_making: "up" | "down" | "flat" | null;
        insights: "up" | "down" | "flat" | null;
        judgement: "up" | "down" | "flat" | null;
      };
    }>;
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
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", data.juniorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw notFound();

    return {
      profile: { id: profile.id, full_name: profile.full_name, sector: null as string | null },
      projects: [] as ManagerProject[],
      snapshots: [] as Array<{
        id: string;
        scored_at: string;
        overall_score: number;
        decision_making_score: number;
        insights_score: number;
        judgement_score: number;
        project_id: string | null;
      }>,
      debriefs: [] as Array<{
        id: string;
        completed_at: string | null;
        case_title: string;
        overall_score: number | null;
        decision_making_score: number | null;
        insights_score: number | null;
        judgement_score: number | null;
      }>,
    };
  });
