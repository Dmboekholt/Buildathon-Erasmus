import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp } from "lucide-react";

import { PageCtaBanner } from "@/components/layout/PageCtaBanner";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { PriorityBadge } from "@/components/layout/PriorityBadge";
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
        <PageEyebrow index="01" label="Improvements" />
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
                <PriorityBadge priority={item.priority} />
              </article>
            ))}
          </div>
        )}
      </section>

      <PageCtaBanner
        icon={TrendingUp}
        title="Small steps drive big improvements."
        subtitle="Keep reviewing, keep improving."
        linkTo="/cases"
        linkLabel="Browse all cases"
      />
    </div>
  );
}
