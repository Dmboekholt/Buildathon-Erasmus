import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/hooks/use-workspace";
import { getJuniorProgress } from "@/lib/manager.functions";

export const Route = createFileRoute("/manager/juniors/$juniorId")({
  component: JuniorDetailPage,
});

type Range = "30" | "90" | "all";

function rangeToFrom(range: Range): string | undefined {
  if (range === "all") return undefined;
  const days = range === "30" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function JuniorDetailPage() {
  const { juniorId } = Route.useParams();
  const { managerId } = useWorkspace();
  const [range, setRange] = useState<Range>("90");
  const from = rangeToFrom(range);

  const fetchProgress = useServerFn(getJuniorProgress);
  const { data, isPending, isError } = useQuery({
    queryKey: ["junior-progress", managerId, juniorId, range],
    queryFn: () =>
      fetchProgress({
        data: { managerId, juniorId, from },
      }),
  });

  const chartData = useMemo(() => {
    return (data?.snapshots ?? []).map((s) => ({
      date: new Date(s.scored_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      decision_making: s.decision_making_score,
      insights: s.insights_score,
      judgement: s.judgement_score,
      overall: s.overall_score,
    }));
  }, [data?.snapshots]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[1280px] px-[60px] py-16">
        <p className="text-caption text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[1280px] px-[60px] py-16">
        <Link
          to="/manager"
          className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Team
        </Link>
        <h1 className="text-page-title text-foreground">Junior not found</h1>
        <p className="mt-2 text-body text-muted-foreground">
          You may not have access to this profile.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-16">
      <Link
        to="/manager"
        className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Team
      </Link>

      <header className="mb-10">
        <h1 className="text-page-title text-foreground">{data.profile.full_name}</h1>
        <p className="mt-2 text-body text-muted-foreground">
          {data.profile.sector ?? "Sector not set"} ·{" "}
          {data.projects.map((p) => p.name).join(", ")}
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        {(
          [
            ["30", "Last 30 days"],
            ["90", "Last 90 days"],
            ["all", "All time"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={[
              "rounded-pill border px-3 py-1 text-caption transition-colors",
              range === key
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-section text-foreground">Score trend (0–10)</h2>
        {chartData.length === 0 ? (
          <p className="text-caption text-muted-foreground">No scored sessions yet.</p>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="decision_making"
                  name="Decision making"
                  stroke="var(--color-foreground)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="insights"
                  name="Insights"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="judgement"
                  name="Judgement"
                  stroke="var(--color-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1}
                  strokeDasharray="2 6"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-section text-foreground">Recent reviews</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Case</TableHead>
              <TableHead className="text-right">Overall</TableHead>
              <TableHead className="text-right">Decision</TableHead>
              <TableHead className="text-right">Insights</TableHead>
              <TableHead className="text-right">Judgement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.debriefs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-caption text-muted-foreground">
                  No scored debriefs yet.
                </TableCell>
              </TableRow>
            ) : (
              data.debriefs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-caption">
                    {d.completed_at
                      ? new Date(d.completed_at).toLocaleDateString("en-GB")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-body">{d.case_title}</TableCell>
                  <TableCell className="text-right font-mono text-body">
                    {d.overall_score ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-caption">
                    {d.decision_making_score ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-caption">
                    {d.insights_score ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-caption">
                    {d.judgement_score ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
