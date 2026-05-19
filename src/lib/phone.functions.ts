import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not configured");
  return key;
}

/**
 * Place an outbound phone call: the Mentor agent calls `toNumber` and
 * interviews the analyst about the given case. Returns the ElevenLabs
 * conversation id, which the client then polls for the transcript.
 */
export const startPhoneReview = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        caseId: z.string().uuid(),
        toNumber: z
          .string()
          .trim()
          .regex(
            /^\+[1-9]\d{6,14}$/,
            "Phone number must be E.164 format, e.g. +19015633904",
          ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = getApiKey();
    const agentId =
      process.env.ELEVENLABS_AGENT_ID ?? process.env.VITE_ELEVENLABS_AGENT_ID;
    const phoneNumberId =
      process.env.ELEVENLABS_PHONE_NUMBER_ID ??
      process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
    if (!agentId) throw new Error("ELEVENLABS_AGENT_ID is not configured");
    if (!phoneNumberId)
      throw new Error(
        "ELEVENLABS_PHONE_NUMBER_ID or ELEVENLABS_AGENT_PHONE_NUMBER_ID is not configured",
      );

    // Load the case so the phone agent gets the same context as the in-app one.
    const { data: c, error } = await supabaseAdmin
      .from("cases")
      .select("company, metadata")
      .eq("id", data.caseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Case not found");

    const res = await fetch(`${ELEVENLABS_API}/convai/twilio/outbound-call`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: data.toNumber,
        conversation_initiation_client_data: {
          dynamic_variables: {
            analyst_work: JSON.stringify(c.metadata ?? {}),
            company: c.company ?? "",
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Outbound call failed (${res.status}): ${text.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as {
      conversation_id?: string;
      callSid?: string;
      success?: boolean;
      message?: string;
    };
    if (!json.conversation_id) {
      throw new Error(
        `No conversation id returned: ${JSON.stringify(json).slice(0, 300)}`,
      );
    }
    return {
      conversationId: json.conversation_id,
      callSid: json.callSid ?? null,
    };
  });

/**
 * Poll an ElevenLabs conversation. Returns its status and, once the call has
 * ended, the joined transcript text ready for scoring.
 */
export const fetchPhoneTranscript = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ conversationId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = getApiKey();
    const res = await fetch(
      `${ELEVENLABS_API}/convai/conversations/${data.conversationId}`,
      { headers: { "xi-api-key": apiKey } },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Could not fetch conversation (${res.status}): ${text.slice(0, 200)}`,
      );
    }
    const json = (await res.json()) as {
      status?: string;
      transcript?: { role?: string; message?: string | null }[];
    };
    const turns = (json.transcript ?? []).filter(
      (t) => (t.message ?? "").trim().length > 0,
    );
    const transcript = turns
      .map((t) => `${t.role ?? "unknown"}: ${t.message}`)
      .join("\n");
    return {
      status: json.status ?? "unknown",
      transcript,
      turnCount: turns.length,
    };
  });
