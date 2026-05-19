import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard } from "lucide-react";

import { PageCtaBanner } from "@/components/layout/PageCtaBanner";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { useWorkspace } from "@/hooks/use-workspace";
import { getPracticeDashboard } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/practice")({
  component: PracticePage,
});

function PracticePage() {
  const { juniorId } = useWorkspace();
  const fetchDashboard = useServerFn(getPracticeDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["practice", juniorId],
    queryFn: () => fetchDashboard({ data: { analystId: juniorId } }),
  });

  const pct =
    data && data.totalAssignments > 0
      ? Math.round((data.passedCount / data.totalAssignments) * 100)
      : 0;

  const yearRows = data?.byYear ?? [
    { year: 1, passed: 0, total: 0 },
    { year: 2, passed: 0, total: 0 },
    { year: 3, passed: 0, total: 0 },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-10">
        <PageEyebrow index="01" label="Practice dashboard" />
        <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
          Track your progress
        </h1>
      </header>

      <section className="mb-12 rounded-lg border border-border bg-card p-8 md:p-10">
        <h2 className="mb-8 text-[20px] font-bold text-foreground">
          Overall progress
        </h2>
        {isLoading ? (
          <p className="text-caption text-muted-foreground">
            Loading dashboard…
          </p>
        ) : (
          <>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] font-bold leading-none text-foreground">
                  {data?.passedCount ?? 0}
                </span>
                <span className="text-[15px] text-muted-foreground">
                  /{data?.totalAssignments ?? 0} passed
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] font-bold leading-none text-foreground">
                  {pct}
                </span>
                <span className="text-[15px] text-muted-foreground">
                  % complete
                </span>
              </div>
            </div>
            <div
              className="mb-10 h-1.5 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall completion"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {yearRows.map((y) => {
                const yearPct =
                  y.total > 0 ? Math.round((y.passed / y.total) * 100) : 0;
                return (
                  <div key={y.year} className="flex flex-col gap-3">
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                      Year {y.year}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[44px] font-bold leading-none text-foreground">
                        {y.passed}
                      </span>
                      <span className="text-[15px] text-muted-foreground">
                        /{y.total}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuenow={yearPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Year ${y.year} progress`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${yearPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <PageCtaBanner
        icon={LayoutDashboard}
        title="Learning builds lasting skill."
        subtitle="Work through assignments in the curriculum."
        linkTo="/curriculum"
        linkLabel="Open curriculum"
      />
    </div>
  );
}
