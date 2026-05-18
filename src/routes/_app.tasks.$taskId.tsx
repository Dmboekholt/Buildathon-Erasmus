import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowLeft, Upload, CheckCircle2, Phone } from "lucide-react";
import { getTask, markTaskDone } from "@/lib/tasks.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/tasks/$taskId")({
  component: TaskDetailPage,
});

const STATUS_LABEL: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  debrief_pending: "Coach call scheduled",
  debrief_complete: "Debrief complete",
  closed: "Closed",
};

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const router = useRouter();
  void router;
  const qc = useQueryClient();
  const fetchTask = useServerFn(getTask);
  const fnMarkDone = useServerFn(markTaskDone);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { id: taskId } }),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file first.");
      setUploading(true);
      try {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${taskId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("task-artifacts")
          .upload(path, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        return fnMarkDone({
          data: { taskId, filePath: path, fileName: file.name },
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["improvements"] });
      refetch();
    },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  if (isLoading || !data?.task) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="text-caption text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const task = data.task;
  const latestDebrief = data.debriefs[0];
  const isPending =
    task.status === "debrief_pending" || latestDebrief?.status === "calling";
  const isDone =
    task.status === "debrief_complete" || task.status === "closed";

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link
        to="/tasks"
        className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All tasks
      </Link>

      <header className="mb-8">
        <div className="text-caption text-muted-foreground">
          {STATUS_LABEL[task.status] ?? task.status}
          {task.due_at && (
            <>
              {" · "}Due{" "}
              <span className="font-mono">
                {new Date(task.due_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
        <h1 className="mt-2 text-page-title text-foreground">{task.title}</h1>
        <p className="mt-3 text-body text-muted-foreground">
          {task.description}
        </p>
      </header>

      {data.artifacts.length > 0 && (
        <section className="mb-8 rounded-md border border-border bg-card px-5 py-4">
          <div className="mb-2 text-caption text-muted-foreground">
            Deliverable
          </div>
          <ul className="space-y-1">
            {data.artifacts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-body">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="truncate">{a.file_name}</span>
                <span className="ml-auto font-mono text-caption text-muted-foreground">
                  {new Date(a.uploaded_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isDone && !isPending && (
        <section className="mb-8 rounded-md border border-border bg-card px-5 py-5">
          <h2 className="text-section text-foreground">Upload deliverable</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Attach your sheet or PDF, then mark the task as done. Your coach
            will call shortly after.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-sm border border-border bg-background px-3 py-2 text-body hover:bg-muted">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className={file ? "text-foreground" : "text-placeholder"}>
                {file ? file.name : "Choose file…"}
              </span>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt"
                onChange={(e) => {
                  setErrorMsg(null);
                  setFile(e.target.files?.[0] ?? null);
                }}
              />
            </label>
            <button
              type="button"
              disabled={!file || uploading || mut.isPending}
              onClick={() => mut.mutate()}
              className="inline-flex h-10 items-center justify-center rounded-sm bg-accent px-4 text-body text-accent-foreground disabled:opacity-50"
            >
              {mut.isPending || uploading ? "Submitting…" : "Mark as done"}
            </button>
          </div>

          {errorMsg && (
            <p className="mt-3 text-caption text-danger">{errorMsg}</p>
          )}
        </section>
      )}

      {isPending && (
        <section className="mb-8 rounded-md border border-border bg-card px-5 py-5">
          <div className="flex items-start gap-3">
            <Phone className="mt-1 h-4 w-4 text-accent" />
            <div>
              <div className="text-body text-foreground">
                Your coach call is being scheduled…
              </div>
              <p className="mt-1 text-caption text-muted-foreground">
                Alex will ring you on the number on file. The debrief takes
                about five to seven minutes.
              </p>
              {latestDebrief?.transcript?.startsWith("[setup note]") && (
                <p className="mt-2 text-caption text-warning">
                  {latestDebrief.transcript.replace("[setup note] ", "")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {latestDebrief?.evaluation_json && (
        <section className="rounded-md border border-border bg-card px-5 py-5">
          <h2 className="text-section text-foreground">Coach summary</h2>
          <p className="mt-2 text-body text-foreground">
            {
              (latestDebrief.evaluation_json as { overall_summary?: string })
                .overall_summary
            }
          </p>
          {(latestDebrief.improvement_items as string[] | null)?.length ? (
            <>
              <div className="mt-4 text-caption text-muted-foreground">
                Focus areas
              </div>
              <ul className="mt-2 space-y-2">
                {(latestDebrief.improvement_items as string[]).map((it, i) => (
                  <li key={i} className="flex gap-3 text-body">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {it}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
