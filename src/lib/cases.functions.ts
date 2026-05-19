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

export const deleteCase = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        juniorId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("cases")
      .select("id, assignee_id, source_file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!row) throw new Error("Case not found");
    if (data.juniorId && row.assignee_id !== data.juniorId) {
      throw new Error("Not allowed to delete this case");
    }

    // Best-effort: remove the original PDF from storage so we don't leak
    // bytes when the case row goes away.
    if (row.source_file_path) {
      await supabaseAdmin.storage
        .from("case-uploads")
        .remove([row.source_file_path])
        .catch(() => {});
    }

    const { error: delErr } = await supabaseAdmin
      .from("cases")
      .delete()
      .eq("id", data.id);
    if (delErr) throw new Error(delErr.message);
    return { ok: true as const };
  });
