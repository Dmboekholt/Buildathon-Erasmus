import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
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
    <div className="mx-auto max-w-[1280px] px-12 py-16">
      {/* Hero */}
      <header className="mb-14 flex items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="eyebrow mb-4">00. Dashboard</div>
          <h1 className="font-display text-[44px] leading-[48px] tracking-[-0.025em] text-foreground">
            Investment case reviews,
            <br />
            <span className="text-muted-foreground">defended on the record.</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Read the memorandum, surface the weak spots, and turn each session
            into a tracked improvement.
          </p>
        </div>
        <Link
          to="/cases"
          className="inline-flex h-11 items-center gap-2 rounded-pill bg-primary pl-5 pr-2 text-body text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse cases
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card/15 text-primary-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </header>

      {/* Section labels row, Faseelh-style numbered eyebrows */}
      <div className="mb-6 grid grid-cols-1 gap-10 border-t border-border pt-6 md:grid-cols-2">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="eyebrow">01.</div>
            <h2 className="mt-1 text-section text-foreground">Cases</h2>
          </div>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="eyebrow">02.</div>
            <h2 className="mt-1 text-section text-foreground">Improvements</h2>
          </div>
          <span className="font-mono text-caption text-muted-foreground">
            {String(improvements.length).padStart(2, "0")} open
          </span>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <section className="flex flex-col gap-5">
          {isLoading ? (
            <div className="text-caption text-muted-foreground">Loading…</div>
          ) : cases.length === 0 ? (
            <div className="text-caption text-muted-foreground">
              No cases yet.
            </div>
          ) : (
            cases.map((c) => {
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
                  className="group block"
                >
                  <article className="flex flex-col gap-5 rounded-lg border border-border bg-card p-7 transition-colors hover:border-foreground/40">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-section font-medium text-foreground">
                        {c.title}
                      </h3>
                      {c.priority && (
                        <Badge
                          variant="outline"
                          className={`shrink-0 rounded-pill bg-background px-2.5 py-0.5 text-caption font-mono font-normal uppercase tracking-wider ${priorityTone}`}
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


                    <div className="flex justify-end">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                  </article>
                </Link>
              );
            })
          )}
        </section>

        <section className="flex flex-col gap-5">
          {improvements.map((item) => {
            const priorityTone =
              item.priority === "High"
                ? "border-foreground/40 text-foreground"
                : item.priority === "Medium"
                  ? "border-border text-muted-foreground"
                  : "border-border text-muted-foreground/70";
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-section font-medium text-foreground">
                    {item.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-pill bg-background px-2.5 py-0.5 text-caption font-mono font-normal uppercase tracking-wider ${priorityTone}`}
                  >
                    {item.priority}
                  </Badge>
                </div>
                <div className="text-caption text-muted-foreground">
                  {item.area}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
