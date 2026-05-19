import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { getActiveJuniorId } from "@/hooks/use-workspace";
import { listImprovements } from "@/lib/review.functions";

export const Route = createFileRoute("/_app/")({
  component: AnalyticsPage,
});

type Category = "Decision Making" | "Insights" | "Judgement";
type Priority = "High" | "Medium" | "Low";

type Improvement = {
  id: string;
  title: string;
  area: string;
  category: string;
  priority: string;
};

const categories: Category[] = ["Decision Making", "Insights", "Judgement"];

const priorityWeight: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function categoryScore(items: Improvement[]) {
  if (items.length === 0) return 0;
  const raw = items.reduce(
    (sum, i) => sum + (priorityWeight[i.priority as Priority] ?? 0),
    0,
  );
  return Math.min(100, Math.round((raw / 15) * 100));
}

function AnalyticsPage() {
  const juniorId = getActiveJuniorId();
  const fetchImprovements = useServerFn(listImprovements);
  const { data } = useQuery({
    queryKey: ["improvements", juniorId],
    queryFn: () => fetchImprovements({ data: { juniorId } }),
  });
  const improvements: Improvement[] = data ?? [];
  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      {/* Hero */}
      <header className="mb-16">
        <div>
          <div className="eyebrow mb-5">Netherlands · Analytics</div>
          <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
            Signals from every review,
            <br />
            measured over time.
          </h1>
          <p className="mt-6 max-w-xl text-body text-foreground">
            Track where decision making, insights, and judgement need the most
            attention across your open work.
          </p>
          <Link
            to="/cases"
            className="mt-8 inline-flex items-center gap-3 bg-primary px-8 py-4 text-[15px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse cases
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Section header */}
      <div className="mb-10 flex items-baseline justify-between border-t-2 border-foreground pt-6">
        <div>
          <div className="eyebrow">01 Improvements</div>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
            Open across the practice
          </h2>
        </div>
        <span className="text-caption text-muted-foreground">
          {String(improvements.length).padStart(2, "0")} open
        </span>
      </div>

      {/* Category score panel */}
      <section className="mb-16 border border-border bg-muted p-10">
        <div className="mb-8 flex items-baseline justify-between">
          <h3 className="text-[20px] font-bold text-foreground">
            Attention by category
          </h3>
          <span className="text-caption text-muted-foreground">
            weighted by priority
          </span>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {categories.map((cat) => {
            const catItems = improvements.filter((i) => i.category === cat);
            const score = categoryScore(catItems);
            const count = catItems.length;
            return (
              <div key={cat} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-bold uppercase tracking-[0.05em] text-foreground">
                    {cat}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {String(count).padStart(2, "0")} open
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="text-[44px] font-bold leading-none text-foreground">
                    {score}
                  </div>
                  <span className="text-caption text-muted-foreground">
                    /100
                  </span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden bg-border"
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat} score`}
                >
                  <div
                    className="h-full bg-primary transition-[width] duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Improvement cards */}
      <section className="grid grid-cols-1 gap-0 border-t border-border md:grid-cols-2">
        {improvements.map((item, idx) => {
          const priorityTone =
            item.priority === "High"
              ? "text-primary"
              : item.priority === "Medium"
                ? "text-foreground"
                : "text-muted-foreground";
          return (
            <article
              key={item.id}
              className={`flex flex-col gap-3 border-b border-border bg-card p-8 ${
                idx % 2 === 0 ? "md:border-r" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[20px] font-bold leading-tight text-foreground">
                  {item.title}
                </h3>
                <span
                  className={`shrink-0 text-[14px] font-bold uppercase tracking-[0.08em] ${priorityTone}`}
                >
                  {item.priority}
                </span>
              </div>
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                <span className="font-bold text-foreground">
                  {item.category}
                </span>
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
