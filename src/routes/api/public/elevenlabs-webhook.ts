import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callAIJSON } from "@/lib/ai.server";
import {
  EVAL_SYSTEM,
  evalUser,
  IMPROVE_SYSTEM,
  improveUser,
} from "@/lib/prompts";

/**
 * ElevenLabs Conversational AI post-call webhook.
 *
 * Configure this URL in the ElevenLabs dashboard for your agent:
 *   {YOUR_DOMAIN}/api/public/elevenlabs-webhook
 *
 * We accept multiple payload shapes — ElevenLabs sends either a top-level
 * conversation object or wraps it in { type: "post_call_transcription", data }.
 */
export const Route = createFileRoute("/api/public/elevenlabs-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        let body: any;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const payload = body?.data ?? body;
        const conversationId: string | undefined =
          payload?.conversation_id ?? payload?.conversationId;
        if (!conversationId) {
          return new Response("Missing conversation_id", { status: 400 });
        }

        // Extract transcript text from common ElevenLabs shapes.
        let transcript = "";
        const t = payload?.transcript;
        if (Array.isArray(t)) {
          transcript = t
            .map((m: any) => {
              const role = m.role ?? m.speaker ?? "speaker";
              const text = m.message ?? m.text ?? m.content ?? "";
              return `${role}: ${text}`;
            })
            .join("\n");
        } else if (typeof t === "string") {
          transcript = t;
        } else if (typeof payload?.transcript_text === "string") {
          transcript = payload.transcript_text;
        }

        // Find debrief
        const { data: debrief, error: findErr } = await supabaseAdmin
          .from("debriefs")
          .select("*, tasks(title, description)")
          .eq("elevenlabs_conversation_id", conversationId)
          .maybeSingle();
        if (findErr || !debrief) {
          return new Response("Unknown conversation", { status: 404 });
        }

        await supabaseAdmin
          .from("debriefs")
          .update({
            transcript,
            status: "transcribed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", debrief.id);

        if (!transcript || transcript.trim().length < 10) {
          return new Response("ok-empty");
        }

        const task = (debrief as any).tasks as {
          title: string;
          description: string;
        };

        try {
          const evaluation = await callAIJSON<Record<string, unknown>>({
            system: EVAL_SYSTEM,
            user: evalUser({
              taskTitle: task.title,
              taskDescription: task.description,
              questionsJson: JSON.stringify(
                (debrief as any).questions_json ?? {},
              ),
              transcript,
            }),
          });

          const improvements = await callAIJSON<{
            improvement_items: string[];
          }>({
            system: IMPROVE_SYSTEM,
            user: improveUser({ evaluationJson: JSON.stringify(evaluation) }),
          });

          await supabaseAdmin
            .from("debriefs")
            .update({
              evaluation_json: evaluation,
              improvement_items: improvements.improvement_items ?? [],
              status: "complete",
            })
            .eq("id", debrief.id);

          await supabaseAdmin
            .from("tasks")
            .update({ status: "debrief_complete" })
            .eq("id", (debrief as any).task_id);
        } catch (e) {
          await supabaseAdmin
            .from("debriefs")
            .update({ status: "evaluation_failed" })
            .eq("id", debrief.id);
          console.error("Eval failed", e);
        }

        return new Response("ok");
      },
    },
  },
});
