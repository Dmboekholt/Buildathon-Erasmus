import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCases } from "@/lib/cases.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

type Improvement = {
  id: string;
  title: string;
  area: string;
  priority: "High" | "Medium" | "Low";
};

const improvements: Improvement[] = [
  {
    id: "i1",
    title: "Tighten revenue bridge assumptions",
    area: "Financial analysis",
    priority: "High",
  },
  {
    id: "i2",
    title: "Probe management succession risk",
    area: "Governance",
    priority: "Medium",
  },
  {
    id: "i3",
    title: "Benchmark margin vs peer set",
    area: "Market analysis",
    priority: "Medium",
  },
  {
    id: "i4",
    title: "Expand downside scenario modelling",
    area: "Risk",
    priority: "Low",
  },
];

function DashboardPage() {
  const fetchCases = useServerFn(listCases);
  const { data, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetchCases(),
  });
  const cases = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <header className="mb-8">
        <h1 className="text-page-title text-foreground">Dashboard</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Investment case reviews.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-section text-foreground">Cases</h2>
            <Link
              to="/cases"
              className="text-caption text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="text-caption text-muted-foreground">Loading…</div>
          ) : cases.length === 0 ? (
            <div className="text-caption text-muted-foreground">
              No cases yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cases.map((c) => (
                <Link
                  key={c.id}
                  to="/cases/$caseId"
                  params={{ caseId: c.id }}
                  className="block"
                >
                  <Card className="border-border bg-card transition-colors hover:border-foreground/30">
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-body text-foreground">{c.title}</h3>
                        {c.mode && (
                          <Badge
                            variant="outline"
                            className="shrink-0 rounded-sm border-border text-caption font-normal text-muted-foreground"
                          >
                            {c.mode}
                          </Badge>
                        )}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        {c.company} · {c.industry}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        Level{" "}
                        <span className="font-mono text-foreground">
                          {c.level}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-section text-foreground">Improvements</h2>
            <span className="font-mono text-caption text-muted-foreground">
              {improvements.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {improvements.map((item) => (
              <Card key={item.id} className="border-border bg-card">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-body text-foreground">{item.title}</h3>
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-sm border-border text-caption font-normal text-muted-foreground"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="text-caption text-muted-foreground">
                    {item.area}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
