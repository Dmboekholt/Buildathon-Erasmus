import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listCases = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, title, company, industry, summary, status, priority, due_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCase = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw notFound();
    return row;
  });

export const createCase = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      title: z.string().min(1).max(255),
      company: z.string().max(255).optional(),
      industry: z.string().max(255).optional(),
      summary: z.string().max(5000).optional(),
      status: z.enum(["open", "in_review", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      due_at: z.string().datetime().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("cases")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
