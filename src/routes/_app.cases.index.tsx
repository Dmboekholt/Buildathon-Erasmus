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
    <div className="mx-auto max-w-6xl px-8 py-12">
      <header className="mb-8">
        <h1 className="text-page-title text-foreground">Cases</h1>
        <p className="mt-1 text-caption text-muted-foreground">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/cases/$caseId"
              params={{ caseId: c.id }}
              className="block"
            >
              <Card className="h-full border-border bg-card transition-colors hover:border-foreground/30">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-section text-foreground">
                      {c.title}
                    </h2>
                    {c.status && (
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-sm border-border text-caption font-normal text-muted-foreground"
                      >
                        {c.status}
                      </Badge>
                    )}
                  </div>
                  <div className="text-body text-foreground">{c.company}</div>
                  <div className="text-caption text-muted-foreground">
                    {c.industry}
                  </div>
                  <div className="mt-auto text-caption text-muted-foreground">
                    Priority{" "}
                    <span className="font-mono text-foreground">
                      {c.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
