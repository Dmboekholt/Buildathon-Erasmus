import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/")({
  component: AnalyticsPage,
});

type Category = "Decision Making" | "Insights" | "Judgement";

type Improvement = {
  id: string;
  title: string;
  area: string;
  category: Category;
  priority: "High" | "Medium" | "Low";
};

const improvements: Improvement[] = [
  {
    id: "i1",
    title: "Tighten revenue bridge assumptions",
    area: "Financial analysis",
    category: "Judgement",
    priority: "High",
  },
  {
    id: "i2",
    title: "Probe management succession risk",
    area: "Governance",
    category: "Decision Making",
    priority: "Medium",
  },
  {
    id: "i3",
    title: "Benchmark margin vs peer set",
    area: "Market analysis",
    category: "Insights",
    priority: "Medium",
  },
  {
    id: "i4",
    title: "Expand downside scenario modelling",
    area: "Risk",
    category: "Judgement",
    priority: "Low",
  },
  {
    id: "i5",
    title: "Document conviction triggers",
    area: "Process",
    category: "Decision Making",
    priority: "High",
  },
  {
    id: "i6",
    title: "Map customer concentration shifts",
    area: "Market analysis",
    category: "Insights",
    priority: "Low",
  },
];

const categories: Category[] = ["Decision Making", "Insights", "Judgement"];

const priorityWeight = { High: 3, Medium: 2, Low: 1 } as const;

function categoryScore(cat: Category) {
  const items = improvements.filter((i) => i.category === cat);
  if (items.length === 0) return 0;
  const raw = items.reduce((sum, i) => sum + priorityWeight[i.priority], 0);
  // Normalize to 0 to 100 using a notional max of 5 high priority items per category.
  const score = Math.min(100, Math.round((raw / 15) * 100));
  return score;
}

function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1280px] py-16 px-[60px]">
      {/* Hero */}
      <header className="mb-14 flex items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="eyebrow mb-4">00. Analytics</div>
          <h1 className="font-display text-[44px] leading-[48px] tracking-[-0.025em] text-foreground">
            Signals from every review,
            <br />
            <span className="text-muted-foreground">measured over time.</span>
          </h1>
          <p className="mt-4 text-body text-muted-foreground">
            Track where decision making, insights, and judgement need the most
            attention across your open cases.
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

      {/* Section header */}
      <div className="mb-8 flex items-baseline justify-between border-t border-border pt-6">
        <div>
          <div className="eyebrow">01.</div>
          <h2 className="mt-1 text-section text-foreground">Improvements</h2>
        </div>
        <span className="font-mono text-caption text-muted-foreground">
          {String(improvements.length).padStart(2, "0")} open
        </span>
      </div>

      {/* Category score panel */}
      <section className="mb-12 rounded-lg border border-border bg-card p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-section font-medium text-foreground">
            Attention by category
          </h3>
          <span className="font-mono text-caption text-muted-foreground">
            weighted by priority
          </span>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {categories.map((cat) => {
            const score = categoryScore(cat);
            const count = improvements.filter((i) => i.category === cat).length;
            return (
              <div key={cat} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-body text-foreground">{cat}</span>
                  <span className="font-mono text-caption text-muted-foreground">
                    {String(count).padStart(2, "0")} open
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="font-display text-[36px] leading-none text-foreground">
                    {score}
                  </div>
                  <span className="font-mono text-caption text-muted-foreground">
                    /100
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat} score`}
                >
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Improvement cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-5"
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
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                <span className="text-foreground">{item.category}</span>
                <span aria-hidden="true">·</span>
                <span>{item.area}</span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
