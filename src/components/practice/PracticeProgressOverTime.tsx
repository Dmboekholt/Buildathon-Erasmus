import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ProgressPoint = { label: string; pct: number };

type PracticeProgressOverTimeProps = {
  data: ProgressPoint[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ProgressPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 shadow-md">
      <p className="text-[12px] text-[#6b6b6b]">{point.label}</p>
      <p className="text-[14px] font-bold text-primary">{point.pct}% complete</p>
    </div>
  );
}

export function PracticeProgressOverTime({
  data,
}: PracticeProgressOverTimeProps) {
  return (
    <div
      className="h-[220px] w-full"
      role="img"
      aria-label="Progress over time chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="practiceProgressFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#e40521" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#e40521" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#ececec"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#9a9a9a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#9a9a9a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="#e40521"
            strokeWidth={2}
            fill="url(#practiceProgressFill)"
            dot={{ r: 4, fill: "#e40521", strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: "#e40521",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
