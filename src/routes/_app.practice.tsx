import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import { getActiveJuniorId } from "@/hooks/use-workspace";
import { getPracticeDashboard } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/practice")({
  component: PracticePage,
});

type JuniorYear = 1 | 2 | 3;

function PracticePage() {
  const juniorId = getActiveJuniorId();
  const fetchDashboard = useServerFn(getPracticeDashboard);
  const [yearFilter, setYearFilter] = useState<JuniorYear | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["practice", juniorId, yearFilter],
    queryFn: () =>
      fetchDashboard({
        data: {
          analystId: juniorId,
          juniorYear: yearFilter ?? undefined,
        },
      }),
  });

  const activeYear = (yearFilter ?? data?.profileJuniorYear ?? 1) as JuniorYear;
  const pct =
    data && data.totalAssignments > 0
      ? Math.round((data.passedCount / data.totalAssignments) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <header className="mb-16">
        <div className="eyebrow mb-5">Netherlands · Practice</div>
        <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
          Your practice
          <br />
          dashboard.
        </h1>
        <p className="mt-6 max-w-xl text-body text-foreground">
          Track assignment progress across all three junior years, see what you
          have learned, and focus on units that still need work.
        </p>
      </header>

      <section className="mb-12 rounded-lg border border-border bg-card p-10">
        <div className="eyebrow mb-4">Overall progress</div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[44px] font-bold leading-none text-foreground">
              {data?.passedCount ?? 0}/{data?.totalAssignments ?? 12}
            </div>
            <span className="text-caption text-muted-foreground">
              assignments passed
            </span>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-bold text-foreground">{pct}%</div>
            <span className="text-caption text-muted-foreground">complete</span>
          </div>
        </div>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data?.byYear.map((y) => (
            <button
              key={y.year}
              type="button"
              onClick={() => setYearFilter(y.year as JuniorYear)}
              className={`rounded-md border p-4 text-left transition-colors hover:bg-muted ${
                activeYear === y.year
                  ? "border-primary bg-muted"
                  : "border-border"
              }`}
            >
              <div className="text-caption text-muted-foreground">
                Year {y.year}
              </div>
              <div className="mt-1 text-[20px] font-bold text-foreground">
                {y.passed}/{y.total}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-t-2 border-foreground pt-6">
        <div>
          <div className="eyebrow">Assignments</div>
          <h2 className="mt-2 text-[24px] font-bold leading-tight text-foreground">
            Year {activeYear} detail
          </h2>
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
        <p className="text-body text-muted-foreground">Loading dashboard.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <section>
            <div className="mb-4 eyebrow">This year</div>
            <ul className="flex flex-col gap-3">
              {data?.assignments.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/curriculum/$caseId"
                    params={{ caseId: a.id }}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted"
                  >
                    <div>
                      <span className="text-caption text-muted-foreground">
                        {String(a.sortOrder).padStart(2, "0")}
                      </span>
                      <div className="font-bold text-foreground">{a.title}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[12px] font-bold uppercase tracking-[0.08em] ${
                          a.status === "passed"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                      {a.bestScore !== null && (
                        <div className="text-caption text-muted-foreground">
                          {a.bestScore}/100
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-10">
            <section className="rounded-lg border border-border bg-card p-8">
              <div className="eyebrow mb-4">What you have learned</div>
              {data?.learned.length ? (
                <ul className="flex flex-col gap-2 text-body text-foreground">
                  {data.learned.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-muted-foreground">
                  Pass assignments to build your learning log.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-8">
              <div className="eyebrow mb-4">Focus next</div>
              {data?.focusNext.length ? (
                <ul className="flex flex-col gap-4">
                  {data.focusNext.map((f) => (
                    <li key={f.id}>
                      <Link
                        to="/curriculum/$caseId"
                        params={{ caseId: f.id }}
                        className="group block"
                      >
                        <div className="font-bold text-foreground group-hover:text-primary">
                          {f.title}
                        </div>
                        {f.gaps.length > 0 && (
                          <p className="mt-1 text-caption text-muted-foreground">
                            {f.gaps[0]}
                          </p>
                        )}
                        <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
                          Practice
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-muted-foreground">
                  All assignments for this year are passed. Great work.
                </p>
              )}
            </section>
          </div>
        </div>
      )}

      <Link
        to="/curriculum"
        className="mt-12 inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.08em] text-primary hover:underline"
      >
        Go to learning curriculum
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
