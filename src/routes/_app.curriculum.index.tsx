import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, GraduationCap } from "lucide-react";

import { PageCtaBanner } from "@/components/layout/PageCtaBanner";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useWorkspace } from "@/hooks/use-workspace";
import { listCurriculum } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/curriculum/")({
  component: CurriculumIndexPage,
});

const YEAR_LABELS: Record<1 | 2 | 3, string> = {
  1: "Junior year 1",
  2: "Junior year 2",
  3: "Junior year 3",
};

type JuniorYear = 1 | 2 | 3;

function CurriculumIndexPage() {
  const { juniorId } = useWorkspace();
  const fetchCurriculum = useServerFn(listCurriculum);
  const [yearFilter, setYearFilter] = useState<JuniorYear | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["curriculum", juniorId, yearFilter],
    queryFn: () =>
      fetchCurriculum({
        data: {
          analystId: juniorId,
          juniorYear: yearFilter ?? undefined,
        },
      }),
  });

  const activeYear = (yearFilter ?? data?.profileJuniorYear ?? 1) as JuniorYear;
  const level = data?.level ?? 1;
  const cases = data?.cases ?? [];

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <PageEyebrow index="02" label="Learning curriculum" />
          <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
            {YEAR_LABELS[activeYear]}
          </h1>
          <p className="mt-2 text-caption text-muted-foreground">
            Analyst level {String(level).padStart(2, "0")} · 4 assignments per
            year
          </p>
        </div>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYearFilter(y)}
              className={`rounded-md px-4 py-2 text-[13px] font-bold uppercase tracking-[0.05em] transition-colors ${
                activeYear === y
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              Year {y}
            </button>
          ))}
        </div>
      </header>

      <section>
        <h2 className="mb-6 text-[20px] font-bold text-foreground">
          Assignments
        </h2>
        {isLoading ? (
          <p className="text-caption text-muted-foreground">
            Loading assignments…
          </p>
        ) : cases.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No assignments for this year yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                to="/curriculum/$caseId"
                params={{ caseId: c.id }}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    Assignment {String(c.sort_order ?? 0).padStart(2, "0")}
                  </p>
                  <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {[c.industry, c.era].filter(Boolean).join(" · ") ||
                      (c.bestScore !== null
                        ? `Best score ${c.bestScore}/100`
                        : "Not started")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PageCtaBanner
        icon={GraduationCap}
        title="Prove what you learned in writing."
        subtitle="See how you are tracking across all years."
        linkTo="/practice"
        linkLabel="View practice dashboard"
      />
    </div>
  );
}
