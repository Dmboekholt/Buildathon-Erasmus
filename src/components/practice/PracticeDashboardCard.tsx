import {
  PracticeAreaBreakdown,
  type PracticeAreaStat,
} from "./PracticeAreaBreakdown";
import {
  PracticeProgressOverTime,
  type ProgressPoint,
} from "./PracticeProgressOverTime";

type PracticeDashboardCardProps = {
  passedCount: number;
  totalAssignments: number;
  progressOverTime: ProgressPoint[];
  byPracticeArea: PracticeAreaStat[];
};

export function PracticeDashboardCard({
  passedCount,
  totalAssignments,
  progressOverTime,
  byPracticeArea,
}: PracticeDashboardCardProps) {
  const pct =
    totalAssignments > 0
      ? Math.round((passedCount / totalAssignments) * 100)
      : 0;

  return (
    <section className="rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-sm md:p-10">
      <h2 className="text-[15px] font-bold text-foreground">Overall progress</h2>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-[40px] font-bold leading-none text-foreground">
            {passedCount}
          </span>
          <span className="text-[15px] text-[#6b6b6b]">
            /{totalAssignments} passed
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[40px] font-bold leading-none text-foreground">
            {pct}
          </span>
          <span className="text-[15px] text-[#6b6b6b]">% complete</span>
        </div>
      </div>

      <div
        className="mt-6 h-3 w-full overflow-hidden rounded-full bg-[#ececec]"
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

      <div className="mt-10 grid grid-cols-1 gap-10 border-t border-[#ececec] pt-10 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-[15px] font-bold text-foreground">
            Progress over time
          </h3>
          <PracticeProgressOverTime data={progressOverTime} />
        </div>
        <div>
          <h3 className="mb-6 text-[15px] font-bold text-foreground">
            By practice area
          </h3>
          <PracticeAreaBreakdown areas={byPracticeArea} />
        </div>
      </div>
    </section>
  );
}

export function PracticeDashboardSkeleton() {
  return (
    <section className="rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-sm md:p-10">
      <div className="h-4 w-32 animate-pulse rounded bg-[#ececec]" />
      <div className="mt-6 flex justify-between gap-4">
        <div className="h-10 w-36 animate-pulse rounded bg-[#ececec]" />
        <div className="h-10 w-28 animate-pulse rounded bg-[#ececec]" />
      </div>
      <div className="mt-6 h-3 w-full animate-pulse rounded-full bg-[#ececec]" />
      <div className="mt-10 grid grid-cols-1 gap-10 border-t border-[#ececec] pt-10 lg:grid-cols-2">
        <div className="h-[220px] animate-pulse rounded-lg bg-[#f5f5f5]" />
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#ececec]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[#ececec]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[#ececec]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
