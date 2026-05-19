import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getActiveJuniorId } from "@/hooks/use-workspace";
import { getPracticeDashboard } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/practice")({
  component: PracticePage,
});

function PracticePage() {
  const juniorId = getActiveJuniorId();
  const fetchDashboard = useServerFn(getPracticeDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["practice", juniorId],
    queryFn: () => fetchDashboard({ data: { analystId: juniorId } }),
  });

  const pct =
    data && data.totalAssignments > 0
      ? Math.round((data.passedCount / data.totalAssignments) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-16">
        <div className="eyebrow mb-5">Netherlands · Practice</div>
        <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.015em] text-foreground">
          Your practice
          <br />
          dashboard.
        </h1>
        <p className="mt-6 max-w-xl text-body text-foreground">
          Track how many assignments you have completed in each junior year.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-10">
        <div className="eyebrow mb-4">Overall progress</div>
        {isLoading ? (
          <p className="text-body text-muted-foreground">Loading dashboard.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="text-[44px] font-bold leading-none text-foreground">
                  {data?.passedCount ?? 0}/{data?.totalAssignments ?? 0}
                </div>
                <span className="text-caption text-muted-foreground">
                  assignments passed
                </span>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold text-foreground">
                  {pct}%
                </div>
                <span className="text-caption text-muted-foreground">
                  complete
                </span>
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
                <div
                  key={y.year}
                  className="rounded-md border border-border p-4"
                >
                  <div className="text-caption text-muted-foreground">
                    Year {y.year}
                  </div>
                  <div className="mt-1 text-[20px] font-bold text-foreground">
                    {y.passed}/{y.total}
                  </div>
                  <div className="mt-1 text-caption text-muted-foreground">
                    {y.total === 1 ? "assignment" : "assignments"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
