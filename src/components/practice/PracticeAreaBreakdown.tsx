import { GitBranch, Lightbulb, Scale, type LucideIcon } from "lucide-react";

export type PracticeAreaStat = {
  area: string;
  label: string;
  passed: number;
  total: number;
  pct: number;
};

const AREA_STYLES: Record<
  string,
  { icon: LucideIcon; fill: string; bg: string; bar: string }
> = {
  decision_making: {
    icon: GitBranch,
    fill: "#e40521",
    bg: "#fce4ec",
    bar: "bg-primary",
  },
  insights: {
    icon: Lightbulb,
    fill: "#f59e0b",
    bg: "#fff7ed",
    bar: "bg-[#f59e0b]",
  },
  judgement: {
    icon: Scale,
    fill: "#8b5cf6",
    bg: "#f5f3ff",
    bar: "bg-[#8b5cf6]",
  },
};

function PracticeAreaRow({ stat }: { stat: PracticeAreaStat }) {
  const style = AREA_STYLES[stat.area] ?? AREA_STYLES.decision_making;
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: style.bg }}
        aria-hidden
      >
        <Icon className="h-5 w-5" style={{ color: style.fill }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-foreground">{stat.label}</p>
        <p className="mt-0.5 text-[13px] text-[#6b6b6b]">
          {stat.passed} / {stat.total} passed
        </p>
      </div>
      <div className="w-[72px] shrink-0">
        <p className="mb-2 text-right text-[15px] font-bold text-foreground">
          {stat.pct}%
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[#ececec]"
          role="progressbar"
          aria-valuenow={stat.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${stat.label} progress`}
        >
          <div
            className={`h-full rounded-full ${style.bar}`}
            style={{ width: `${stat.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PracticeAreaBreakdown({ areas }: { areas: PracticeAreaStat[] }) {
  return (
    <div className="flex flex-col gap-6">
      {areas.map((stat) => (
        <PracticeAreaRow key={stat.area} stat={stat} />
      ))}
    </div>
  );
}
