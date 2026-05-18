import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks } from "@/lib/tasks.functions";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_app/tasks/")({
  component: TasksPage,
});

const STATUS_LABEL: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  debrief_pending: "Coach call scheduled",
  debrief_complete: "Debrief complete",
  closed: "Closed",
};

function TasksPage() {
  const fetchTasks = useServerFn(listTasks);
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchTasks(),
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <header className="mb-10">
        <h1 className="text-page-title text-foreground">Tasks</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Everything assigned to you, newest first.
        </p>
      </header>

      <div className="rounded-md border border-border bg-card">
        {isLoading ? (
          <div className="px-5 py-8 text-caption text-muted-foreground">
            Loading…
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="px-5 py-8 text-caption text-muted-foreground">
            No tasks yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((t) => (
              <li key={t.id}>
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: t.id }}
                  className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-body text-foreground">
                      {t.title}
                    </div>
                    <div className="mt-1 line-clamp-1 text-caption text-muted-foreground">
                      {t.description}
                    </div>
                    <div className="mt-2 text-caption text-muted-foreground">
                      {STATUS_LABEL[t.status] ?? t.status}
                      {t.due_at && (
                        <>
                          {" · "}Due{" "}
                          <span className="font-mono">
                            {new Date(t.due_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
