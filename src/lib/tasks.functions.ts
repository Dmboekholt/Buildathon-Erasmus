import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEMO_JUNIOR_ID, DEMO_JUNIOR_FIRST_NAME } from "./demo";
import { callAIJSON } from "./ai.server";
import {
  QUESTIONS_SYSTEM,
  questionsUser,
} from "./prompts";

export const listTasks = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("assignee_id", DEMO_JUNIOR_ID)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getTask = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const [{ data: task, error }, { data: artifacts }, { data: debriefs }] =
      await Promise.all([
        supabaseAdmin.from("tasks").select("*").eq("id", data.id).single(),
        supabaseAdmin
          .from("artifacts")
          .select("*")
          .eq("task_id", data.id)
          .order("uploaded_at", { ascending: false }),
        supabaseAdmin
          .from("debriefs")
          .select("*")
          .eq("task_id", data.id)
          .order("created_at", { ascending: false }),
      ]);
    if (error) throw new Error(error.message);
    return { task, artifacts: artifacts ?? [], debriefs: debriefs ?? [] };
  });

export const listImprovements = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("debriefs")
      .select("improvement_items, completed_at, task_id, tasks(title)")
      .not("improvement_items", "is", null)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(5);
    if (error) throw new Error(error.message);

    // Flatten and de-dupe, keep first 5
    const seen = new Set<string>();
    const items: { text: string; taskTitle: string | null }[] = [];
    for (const row of data ?? []) {
      const arr = (row.improvement_items as string[] | null) ?? [];
      const taskTitle =
        (row.tasks as { title: string } | null)?.title ?? null;
      for (const t of arr) {
        const key = t.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ text: t, taskTitle });
          if (items.length >= 5) return items;
        }
      }
    }
    return items;
  },
);

const MarkDoneInput = z.object({
  taskId: z.string().uuid(),
  filePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
});

export const markTaskDone = createServerFn({ method: "POST" })
  .inputValidator((input) => MarkDoneInput.parse(input))
  .handler(async ({ data }) => {
    // 1. Insert artifact
    const { error: artErr } = await supabaseAdmin.from("artifacts").insert({
      task_id: data.taskId,
      file_path: data.filePath,
      file_name: data.fileName,
    });
    if (artErr) throw new Error(artErr.message);

    // 2. Load task
    const { data: task, error: taskErr } = await supabaseAdmin
      .from("tasks")
      .select("*, profiles!tasks_assignee_id_fkey(full_name, phone)")
      .eq("id", data.taskId)
      .single();
    if (taskErr) throw new Error(taskErr.message);

    // 3. Update task → debrief_pending
    await supabaseAdmin
      .from("tasks")
      .update({ status: "debrief_pending" })
      .eq("id", data.taskId);

    // 4. Generate questions
    type QuestionsResponse = {
      debrief_theme: string;
      questions: Array<{
        id: string;
        spoken_question: string;
        intent: string;
        strong_answer_signals: string[];
        follow_up_if_vague: string;
      }>;
    };
    const questions = await callAIJSON<QuestionsResponse>({
      system: QUESTIONS_SYSTEM,
      user: questionsUser({
        taskTitle: task.title,
        taskDescription: task.description,
        artifactSummary: data.fileName,
      }),
    });

    // 5. Insert debrief row
    const { data: debrief, error: debErr } = await supabaseAdmin
      .from("debriefs")
      .insert({
        task_id: data.taskId,
        questions_json: questions,
        status: "scheduling",
      })
      .select("*")
      .single();
    if (debErr) throw new Error(debErr.message);

    // 6. Trigger ElevenLabs outbound call
    const profile = (
      task as unknown as {
        profiles: { full_name: string; phone: string | null };
      }
    ).profiles;
    const phone = profile?.phone;
    const firstName =
      profile?.full_name?.split(" ")[0] ?? DEMO_JUNIOR_FIRST_NAME;

    let conversationId: string | null = null;
    let callError: string | null = null;

    if (phone && phone !== "+447000000000") {
      try {
        const elRes = await fetch(
          "https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call",
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agent_id: process.env.ELEVENLABS_AGENT_ID,
              agent_phone_number_id:
                process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID,
              to_number: phone,
              conversation_initiation_client_data: {
                dynamic_variables: {
                  junior_first_name: firstName,
                  task_title: task.title,
                  questions_json: JSON.stringify(questions.questions ?? []),
                },
              },
            }),
          },
        );
        const elBody = (await elRes.json().catch(() => ({}))) as {
          conversation_id?: string;
          message?: string;
        };
        if (!elRes.ok) {
          callError = elBody?.message ?? `ElevenLabs ${elRes.status}`;
        } else {
          conversationId = elBody.conversation_id ?? null;
        }
      } catch (e) {
        callError = (e as Error).message;
      }
    } else {
      callError =
        "No real phone number on profile. Update the demo junior's phone in the database to receive a real call.";
    }

    await supabaseAdmin
      .from("debriefs")
      .update({
        elevenlabs_conversation_id: conversationId,
        status: conversationId ? "calling" : "call_failed",
        transcript: callError ? `[setup note] ${callError}` : null,
      })
      .eq("id", debrief.id);

    return {
      ok: true,
      debriefId: debrief.id,
      conversationId,
      callError,
    };
  });
