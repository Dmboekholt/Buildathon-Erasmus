import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCases } from "@/lib/cases.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/cases/")({
  component: CasesPage,
});

function CasesPage() {
  const fetchCases = useServerFn(listCases);
  const { data, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetchCases(),
  });

  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <header className="mb-12">
        <div className="eyebrow mb-4">Netherlands · Cases</div>
        <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
          Cases.
        </h1>
        <p className="mt-4 max-w-2xl text-body text-foreground">
          Memoranda and engagements available for review.
        </p>
      </header>

      {isLoading ? (
        <div className="text-caption text-muted-foreground">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <div className="text-caption text-muted-foreground">No cases yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-0 border-t border-border md:grid-cols-2">
          {(data ?? []).map((c, idx) => {
            const priorityTone =
              c.priority === "high"
                ? "text-primary"
                : c.priority === "medium"
                  ? "text-foreground"
                  : "text-muted-foreground";
            return (
              <Link
                key={c.id}
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className={`group flex flex-col gap-6 border-b border-border bg-card p-8 transition-colors hover:bg-muted ${
                  idx % 2 === 0 ? "md:border-r" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[22px] font-bold leading-tight text-foreground group-hover:text-primary">
                    {c.title}
                  </h2>
                  {c.priority && (
                    <span
                      className={`shrink-0 text-[14px] font-bold uppercase tracking-[0.08em] ${priorityTone}`}
                    >
                      {c.priority}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-[15px] font-bold uppercase tracking-[0.05em] text-foreground">
                    {c.company}
                  </div>
                  <div className="text-caption text-muted-foreground">
                    {c.industry}
                  </div>
                </div>

                {c.summary && (
                  <p className="text-body leading-relaxed text-foreground">
                    {c.summary}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
