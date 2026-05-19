import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ChevronRight, TrendingUp } from "lucide-react";

import { useWorkspace } from "@/hooks/use-workspace";
import { listImprovements } from "@/lib/review.functions";

export const Route = createFileRoute("/_app/")({
  component: ImprovementsPage,
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

const MAX_IMPROVEMENT_CARDS = 6;

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

function PriorityBadge({ priority }: { priority: string }) {
  const label = priority.toUpperCase();
  if (label === "HIGH") {
    return (
      <span className="shrink-0 rounded-full bg-[#fce4ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
        HIGH
      </span>
    );
  }
  if (label === "MEDIUM") {
    return (
      <span className="shrink-0 rounded-full bg-[#fff3e0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#e65100]">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
      {label === "LOW" ? "Low" : priority}
    </span>
  );
}

function ImprovementsPage() {
  const { juniorId } = useWorkspace();
  const fetchImprovements = useServerFn(listImprovements);
  const { data } = useQuery({
    queryKey: ["improvements", juniorId],
    queryFn: () => fetchImprovements({ data: { juniorId } }),
  });
  const improvements: Improvement[] = data ?? [];
  const topImprovements = [...improvements]
    .sort(
      (a, b) =>
        (priorityWeight[b.priority as Priority] ?? 0) -
        (priorityWeight[a.priority as Priority] ?? 0),
    )
    .slice(0, MAX_IMPROVEMENT_CARDS);

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-10">
        <div className="text-[14px] font-bold uppercase tracking-[0.08em]">
          <span className="text-primary">01</span>
          <span className="text-muted-foreground"> Improvements</span>
        </div>
        <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
          Open across the practice
        </h1>
      </header>

      <section className="mb-12 rounded-lg border border-border bg-card p-8 md:p-10">
        <h2 className="mb-8 text-[20px] font-bold text-foreground">
          Attention by category
        </h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {categories.map((cat) => {
            const catItems = improvements.filter((i) => i.category === cat);
            const score = categoryScore(catItems);
            return (
              <div key={cat} className="flex flex-col gap-3">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {cat}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[44px] font-bold leading-none text-foreground">
                    {score}
                  </span>
                  <span className="text-[15px] text-muted-foreground">
                    /100
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat} score`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-[20px] font-bold text-foreground">
          Top improvement areas
        </h2>
        {topImprovements.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No open improvement areas yet. Complete a case review to get
            started.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topImprovements.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-5"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-bold leading-snug text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {item.category} · {item.area}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <PriorityBadge priority={item.priority} />
                  <ChevronRight
                    className="h-5 w-5 text-muted-foreground/40"
                    aria-hidden
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-card px-8 py-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fce4ec]"
            aria-hidden
          >
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-foreground">
              Small steps drive big improvements.
            </p>
            <p className="mt-0.5 text-caption text-muted-foreground">
              Keep reviewing, keep improving.
            </p>
          </div>
        </div>
        <Link
          to="/cases"
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-[14px] font-bold text-foreground transition-colors hover:bg-muted"
        >
          Browse all cases
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
