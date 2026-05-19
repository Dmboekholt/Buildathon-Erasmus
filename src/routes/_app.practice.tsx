import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  PracticeDashboardCard,
  PracticeDashboardSkeleton,
} from "@/components/practice/PracticeDashboardCard";
import { PracticeCtaBanner } from "@/components/practice/PracticeCtaBanner";
import type { PracticeAreaStat } from "@/components/practice/PracticeAreaBreakdown";
import type { ProgressPoint } from "@/components/practice/PracticeProgressOverTime";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { useWorkspace } from "@/hooks/use-workspace";
import { getPracticeDashboard } from "@/lib/curriculum.functions";

export const Route = createFileRoute("/_app/practice")({
  component: PracticePage,
});

const DEFAULT_AREAS: PracticeAreaStat[] = [
  {
    area: "decision_making",
    label: "Decision Making",
    passed: 0,
    total: 6,
    pct: 0,
  },
  { area: "insights", label: "Insights", passed: 0, total: 4, pct: 0 },
  { area: "judgement", label: "Judgement", passed: 0, total: 2, pct: 0 },
];

function defaultProgressOverTime(): ProgressPoint[] {
  const now = new Date();
  const points: ProgressPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.toLocaleDateString("en-GB", { month: "short" });
    const y = String(d.getFullYear()).slice(-2);
    points.push({ label: `${m} '${y}`, pct: 0 });
  }
  return points;
}

function PracticePage() {
  const { juniorId } = useWorkspace();
  const fetchDashboard = useServerFn(getPracticeDashboard);

  const { data, isLoading } = useQuery({
    queryKey: ["practice", juniorId],
    queryFn: () => fetchDashboard({ data: { analystId: juniorId } }),
  });

  const progressOverTime = data?.progressOverTime ?? defaultProgressOverTime();
  const byPracticeArea = data?.byPracticeArea ?? DEFAULT_AREAS;

  return (
    <div className="min-h-full bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1280px] px-[60px] py-20">
        <header className="mb-10">
          <PageEyebrow index="01" label="Practice dashboard" />
          <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
            Track your progress
          </h1>
          <p className="mt-2 text-[16px] text-[#6b6b6b]">
            See how you&apos;re improving across all practices and over time.
          </p>
        </header>

        {isLoading ? (
          <PracticeDashboardSkeleton />
        ) : (
          <PracticeDashboardCard
            passedCount={data?.passedCount ?? 0}
            totalAssignments={data?.totalAssignments ?? 12}
            progressOverTime={progressOverTime}
            byPracticeArea={byPracticeArea}
          />
        )}

        <PracticeCtaBanner />
      </div>
    </div>
  );
}
