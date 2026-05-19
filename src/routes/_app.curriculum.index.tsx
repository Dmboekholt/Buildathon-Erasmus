import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { getActiveJuniorId } from "@/hooks/use-workspace";
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

function statusLabel(status: string) {
  if (status === "passed") return "Passed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function CurriculumIndexPage() {
  const juniorId = getActiveJuniorId();
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
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <header className="mb-16">
        <div className="eyebrow mb-5">Netherlands · Learning</div>
        <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
          Learn from the archive,
          <br />
          then prove it in writing.
        </h1>
        <p className="mt-6 max-w-xl text-body text-foreground">
          Read the brief, answer open questions in your own words, and get AI
          feedback on whether you understood the material.
        </p>
        <Link
          to="/practice"
          className="mt-8 inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em] text-primary hover:underline"
        >
          View practice dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-t-2 border-foreground pt-6">
        <div>
          <div className="eyebrow">01 Your track</div>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
            {YEAR_LABELS[activeYear]}
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">
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
      </div>

      {isLoading ? (
        <p className="text-body text-muted-foreground">Loading assignments.</p>
      ) : cases.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No assignments for this year yet.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              to="/curriculum/$caseId"
              params={{ caseId: c.id }}
              className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-8 transition-colors hover:border-primary hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-caption text-muted-foreground">
                    Assignment {String(c.sort_order ?? 0).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-[20px] font-bold leading-tight text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 text-[12px] font-bold uppercase tracking-[0.08em] ${
                    c.status === "passed"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {statusLabel(c.status)}
                </span>
              </div>
              {c.learning_objective && (
                <p className="line-clamp-2 text-caption text-muted-foreground">
                  {c.learning_objective}
                </p>
              )}
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                {c.industry && (
                  <span className="font-bold text-foreground">{c.industry}</span>
                )}
                {c.industry && c.era && <span aria-hidden="true">·</span>}
                {c.era && <span>{c.era}</span>}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-caption text-muted-foreground">
                  {c.bestScore !== null
                    ? `Best score ${c.bestScore}/100`
                    : "Not started"}
                </span>
                <ArrowRight className="h-4 w-4 text-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
