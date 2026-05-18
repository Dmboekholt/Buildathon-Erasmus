import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, listImprovements } from "@/lib/tasks.functions";

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
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-10">
        <h1 className="text-page-title text-foreground">Home</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Your assigned tasks and current focus areas.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-section text-foreground">Tasks</h2>
            <Link
              to="/tasks"
              className="text-caption text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="rounded-sm border border-border bg-card">
            {tasks.isLoading ? (
              <div className="px-4 py-6 text-caption text-muted-foreground">
                Loading
              </div>
            ) : (tasks.data ?? []).length === 0 ? (
              <div className="px-4 py-6 text-caption text-muted-foreground">
                No tasks yet
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(tasks.data ?? []).slice(0, 6).map((t) => (
                  <li key={t.id}>
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: t.id }}
                      className="block px-4 py-4 hover:bg-muted/60"
                    >
                      <div className="text-body text-foreground">
                        {t.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-caption text-muted-foreground">
                        <span>ID {t.id.slice(0, 8)}</span>
                        {t.due_at && (
                          <span>
                            Due {new Date(t.due_at).toLocaleDateString()}
                          </span>
                        )}
                        <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-section text-foreground">Improvement list</h2>
          </div>
          <div className="rounded-sm border border-border bg-card">
            {improvements.isLoading ? (
              <div className="px-4 py-6 text-caption text-muted-foreground">
                Loading
              </div>
            ) : (improvements.data ?? []).length === 0 ? (
              <div className="px-4 py-6 text-caption text-muted-foreground">
                Complete a task debrief to see focus areas.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(improvements.data ?? []).map((item, i) => (
                  <li key={i} className="px-4 py-4">
                    <div className="text-body text-foreground">{item.text}</div>
                    {item.taskTitle && (
                      <div className="mt-1 text-caption text-muted-foreground">
                        From {item.taskTitle}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
