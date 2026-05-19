import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { kimiChatJson } from "@/lib/kimi";

const MOONSHOT_API = "https://api.moonshot.ai/v1";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_CHARS = 120_000;
const SOURCE_BUCKET = "case-uploads";

function moonshotApiKey(): string {
  const key = process.env.KIMI_2_6_API_KEY;
  if (!key) throw new Error("KIMI_2_6_API_KEY is not configured");
  return key;
}

const DivisionSchema = z.object({
  name: z.string().min(1).max(120),
  fy2024_revenue_share: z.string().min(1).max(40),
});

const FinancialRowSchema = z.object({
  fy: z.string().min(1).max(40),
  revenue: z.number(),
  ebitda: z.number(),
  ebitda_margin: z.string().min(1).max(40),
});

const DecisionSchema = z.object({
  id: z.string().min(1).max(40),
  section: z.string().min(1).max(80),
  claim: z.string().min(1).max(400),
  analyst_rationale_as_written: z.string().min(1).max(600),
});

const CaseMetadataSchema = z.object({
  investment_highlights_as_written: z.array(z.string().min(1).max(400)).max(12).default([]),
  company_profile: z
    .object({
      description: z.string().max(2000).optional(),
      divisions: z.array(DivisionSchema).max(12).optional(),
    })
    .optional(),
  financials: z
    .object({
      currency: z.string().max(40).optional(),
      historical: z.array(FinancialRowSchema).max(10).optional(),
    })
    .optional(),
  decisions: z.array(DecisionSchema).max(20).default([]),
  management: z
    .object({
      summary: z.string().max(2000).optional(),
    })
    .optional(),
});

const PrioritySchema = z
  .enum(["high", "medium", "low"])
  .or(z.enum(["High", "Medium", "Low"]).transform((v) => v.toLowerCase() as "high" | "medium" | "low"));

const ExtractedCaseSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  industry: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  priority: PrioritySchema.optional(),
  metadata: CaseMetadataSchema,
});

export type ExtractedCase = z.infer<typeof ExtractedCaseSchema>;

const EXTRACTION_SYSTEM = `You are extracting structured deal data from an investment memorandum / CIM / teaser for an audit-firm case-review tool.

Return ONE JSON object with EXACTLY this shape and nothing else:

{
  "title": string,                       // short deal title, e.g. "Ferroline industrial rollup"
  "company": string,                     // target legal/trading name
  "industry": string,                    // one short phrase, e.g. "Industrial distribution"
  "summary": string,                     // 1-2 sentence neutral deal summary
  "priority": "high" | "medium" | "low", // infer from urgency / timeline / risk language
  "metadata": {
    "investment_highlights_as_written": string[],   // 3-8 short verbatim-style bullets pulled from the doc
    "company_profile": {
      "description": string,                         // 2-4 sentences
      "divisions": [ { "name": string, "fy2024_revenue_share": string } ]  // include % sign in the share
    },
    "financials": {
      "currency": string,                            // e.g. "EUR millions", "GBP millions", "USD millions"
      "historical": [ { "fy": string, "revenue": number, "ebitda": number, "ebitda_margin": string } ]
    },
    "decisions": [
      { "id": string, "section": string, "claim": string, "analyst_rationale_as_written": string }
    ],
    "management": { "summary": string }
  }
}

Rules:
- Output JSON only. No prose, no markdown, no code fences.
- Use numbers (not strings) for revenue/ebitda. Margins stay as "11.4%"-style strings.
- If a section is missing in the doc, return an empty array / omit optional keys — never invent figures.
- Keep highlights short, as written. Do not editorialize.
- Use decision ids like "d1", "d2", "d3"... in order of appearance.
- Do not include any field outside the shape above.`;

export const createCaseFromUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) {
      throw new Error("Expected multipart/form-data upload");
    }
    const file = input.get("file");
    const juniorId = String(input.get("juniorId") ?? "");
    if (!juniorId) throw new Error("juniorId is required");
    if (!(file instanceof File)) throw new Error("file is required");
    if (file.type && file.type !== "application/pdf") {
      throw new Error("Only PDF uploads are supported");
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only PDF uploads are supported");
    }
    if (file.size === 0) throw new Error("Uploaded PDF is empty");
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("PDF too large (max 25 MB)");
    }
    return { file, juniorId };
  })
  .handler(async ({ data }): Promise<{ id: string }> => {
    const apiKey = moonshotApiKey();
    const safeName = data.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `${data.juniorId}/${crypto.randomUUID()}-${safeName}`;

    // 1. Save the original PDF to Supabase Storage (best-effort: we still
    //    want to create the case even if storage misbehaves, but for the
    //    demo we fail loud so the user sees what's wrong).
    {
      const { error } = await supabaseAdmin.storage
        .from(SOURCE_BUCKET)
        .upload(path, data.file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }
    }

    // 2. Upload the PDF to Moonshot for text extraction.
    let fileId: string;
    {
      const fd = new FormData();
      fd.append("file", data.file, data.file.name);
      fd.append("purpose", "file-extract");
      const res = await fetch(`${MOONSHOT_API}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Moonshot file upload failed (${res.status}): ${body.slice(0, 300)}`,
        );
      }
      const json = (await res.json()) as { id?: string };
      if (!json.id) {
        throw new Error("Moonshot file upload returned no id");
      }
      fileId = json.id;
    }

    // 3. Pull extracted plain text.
    let extracted: string;
    {
      const res = await fetch(`${MOONSHOT_API}/files/${fileId}/content`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Moonshot file content failed (${res.status}): ${body.slice(0, 300)}`,
        );
      }
      extracted = await res.text();
      if (!extracted.trim()) {
        throw new Error(
          "Could not read any text from this PDF (it may be a scanned image). Try a digital/text PDF.",
        );
      }
    }

    // Best-effort cleanup of the Moonshot-side file. Don't fail the request
    // if it errors — the content has already been read.
    fetch(`${MOONSHOT_API}/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => {});

    // 4. Structure with Kimi (JSON mode).
    const userText = extracted.slice(0, MAX_TEXT_CHARS);
    const raw = await kimiChatJson({
      system: EXTRACTION_SYSTEM,
      user: userText,
    });
    let parsed: ExtractedCase;
    try {
      parsed = ExtractedCaseSchema.parse(JSON.parse(raw));
    } catch (e) {
      throw new Error(
        `Failed to parse extraction JSON: ${(e as Error).message}. Raw: ${raw.slice(0, 200)}`,
      );
    }

    // 5. Insert the case row, assigned to the active junior.
    const { data: row, error: insertErr } = await supabaseAdmin
      .from("cases")
      .insert({
        title: parsed.title,
        company: parsed.company,
        industry: parsed.industry ?? null,
        summary: parsed.summary ?? null,
        status: "open",
        priority: parsed.priority ?? "medium",
        assignee_id: data.juniorId,
        source_file_path: path,
        source_file_name: data.file.name,
        metadata: parsed.metadata as never,
      })
      .select("id")
      .single();
    if (insertErr || !row) {
      throw new Error(
        `Failed to create case: ${insertErr?.message ?? "unknown error"}`,
      );
    }

    return { id: row.id as string };
  });

export const getSignedSourceUrl = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ caseId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("cases")
      .select("source_file_path, source_file_name")
      .eq("id", data.caseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.source_file_path) {
      throw new Error("No source file on this case");
    }
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(SOURCE_BUCKET)
      .createSignedUrl(row.source_file_path, 60 * 5);
    if (signErr || !signed?.signedUrl) {
      throw new Error(signErr?.message ?? "Could not sign source URL");
    }
    return {
      url: signed.signedUrl,
      name: row.source_file_name ?? "source.pdf",
    };
  });
