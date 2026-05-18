import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, listImprovements } from "@/lib/tasks.functions";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

const STATUS_LABEL: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  debrief_pending: "Coach call scheduled",
  debrief_complete: "Debrief complete",
  closed: "Closed",
};

function HomePage() {
  const fetchTasks = useServerFn(listTasks);
  const fetchImprovements = useServerFn(listImprovements);

  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchTasks(),
  });
  const improvements = useQuery({
    queryKey: ["improvements"],
    queryFn: () => fetchImprovements(),
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <header className="mb-10">
        <h1 className="text-page-title text-foreground">Home</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Your assigned tasks and current focus areas.
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-section text-foreground">Tasks</h2>
          <Link
            to="/tasks"
            className="text-caption text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="rounded-md border border-border bg-card">
          {tasks.isLoading ? (
            <div className="px-5 py-8 text-caption text-muted-foreground">
              Loading…
            </div>
          ) : (tasks.data ?? []).length === 0 ? (
            <div className="px-5 py-8 text-caption text-muted-foreground">
              No tasks yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(tasks.data ?? []).slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: t.id }}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-body text-foreground">
                        {t.title}
                      </div>
                      <div className="mt-1 text-caption text-muted-foreground">
                        {STATUS_LABEL[t.status] ?? t.status}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-section text-foreground">Improvement list</h2>
        </div>
        <div className="rounded-md border border-border bg-card px-5 py-5">
          {improvements.isLoading ? (
            <div className="text-caption text-muted-foreground">Loading…</div>
          ) : (improvements.data ?? []).length === 0 ? (
            <p className="text-body text-muted-foreground">
              Complete a task debrief to see focus areas.
            </p>
          ) : (
            <ul className="space-y-3">
              {(improvements.data ?? []).map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <div className="text-body text-foreground">{item.text}</div>
                    {item.taskTitle && (
                      <div className="mt-0.5 text-caption text-muted-foreground">
                        From: {item.taskTitle}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
