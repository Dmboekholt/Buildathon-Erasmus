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
    <div className="mx-auto max-w-[1280px] py-16 px-[60px]">
      <header className="mb-12">
        <h1 className="text-page-title text-foreground"><Highlight>Cases</Highlight></h1>
        <p className="mt-3 text-caption text-muted-foreground">
          Investment memoranda available for review.
        </p>
      </header>

      {isLoading ? (
        <div className="text-caption text-muted-foreground">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <div className="text-caption text-muted-foreground">
          No cases yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {(data ?? []).map((c) => {
            const priorityTone =
              c.priority === "high"
                ? "border-foreground/40 text-foreground"
                : c.priority === "medium"
                  ? "border-border text-muted-foreground"
                  : "border-border text-muted-foreground/70";
            return (
              <Link
                key={c.id}
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="block"
              >
                <Card className="h-full border-border bg-card transition-colors hover:border-foreground/30">
                  <CardContent className="flex h-full flex-col gap-6 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-section text-foreground">
                        {c.title}
                      </h2>
                      {c.priority && (
                        <Badge
                          variant="outline"
                          className={`shrink-0 rounded-pill px-2.5 py-0.5 text-caption font-mono font-normal uppercase tracking-wider ${priorityTone}`}
                        >
                          {c.priority}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-caption font-medium text-foreground">
                        {c.company}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        {c.industry}
                      </div>
                    </div>

                    {c.summary && (
                      <p className="text-body leading-relaxed text-muted-foreground">
                        {c.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
