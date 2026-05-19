import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listCases = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ juniorId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("cases")
      .select("id, title, company, industry, summary, status, priority, due_at, created_at")
      .eq("assignee_id", data.juniorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCase = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        juniorId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw notFound();
    if (data.juniorId && row.assignee_id !== data.juniorId) throw notFound();
    return row;
  });
