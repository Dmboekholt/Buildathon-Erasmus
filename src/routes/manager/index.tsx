import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listManagerProjects,
  listManagers,
  listVisibleJuniors,
} from "@/lib/manager.functions";

export const Route = createFileRoute("/manager/")({
  component: ManagerRosterPage,
});

function TrendCell({ value }: { value: "up" | "down" | "flat" | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const label = value === "up" ? "↑" : value === "down" ? "↓" : "→";
  return <span className="font-mono text-caption">{label}</span>;
}

function ManagerRosterPage() {
  const { managerId } = useWorkspace();
  const [projectId, setProjectId] = useState<string>("all");

  useEffect(() => {
    setProjectId("all");
  }, [managerId]);

  const fetchManagers = useServerFn(listManagers);
  const fetchProjects = useServerFn(listManagerProjects);
  const fetchJuniors = useServerFn(listVisibleJuniors);

  const { data: managers } = useQuery({
    queryKey: ["managers"],
    queryFn: () => fetchManagers(),
  });
  const { data: projects } = useQuery({
    queryKey: ["manager-projects", managerId],
    queryFn: () => fetchProjects({ data: { managerId } }),
  });
  const { data: juniors, isPending } = useQuery({
    queryKey: ["visible-juniors", managerId, projectId],
    queryFn: () =>
      fetchJuniors({
        data: {
          managerId,
          projectId: projectId === "all" ? undefined : projectId,
        },
      }),
  });

  const actingManager = (managers ?? []).find((m) => m.id === managerId);
  const roster = juniors ?? [];
  const withScores = roster.filter((j) => j.latest);
  const improving = roster.filter((j) => j.trends.overall === "up").length;
  const avgOverall =
    withScores.length > 0
      ? (
          withScores.reduce((s, j) => s + (j.latest?.overall ?? 0), 0) /
          withScores.length
        ).toFixed(1)
      : "—";

  return (
    <div className="mx-auto max-w-[1280px] py-16 px-[60px]">
      <header className="mb-10">
        <div className="eyebrow mb-4">Manager</div>
        <h1 className="text-page-title text-foreground">Team progress</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Acting as {actingManager?.full_name ?? "Manager"}
        </p>
      </header>

      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Juniors in view", value: String(roster.length).padStart(2, "0") },
          { label: "Avg overall (latest)", value: avgOverall },
          { label: "Improving overall", value: String(improving) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-border bg-card px-5 py-4"
          >
            <div className="text-caption text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-mono text-section text-foreground">
              {kpi.value}
            </div>
          </div>
        ))}
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setProjectId("all")}
          className={[
            "rounded-pill border px-3 py-1 text-caption transition-colors",
            projectId === "all"
              ? "border-foreground bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          All projects
        </button>
        {(projects ?? []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProjectId(p.id)}
            className={[
              "rounded-pill border px-3 py-1 text-caption transition-colors",
              projectId === p.id
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {p.name}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-caption text-muted-foreground">Loading team…</p>
      ) : roster.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          No juniors visible for this manager on the selected project.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Junior</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Overall</TableHead>
                <TableHead className="text-right">Decision</TableHead>
                <TableHead className="text-right">Insights</TableHead>
                <TableHead className="text-right">Judgement</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((j) => (
                <TableRow key={j.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Link
                      to="/manager/juniors/$juniorId"
                      params={{ juniorId: j.id }}
                      className="text-body font-medium text-foreground"
                    >
                      {j.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-caption text-muted-foreground">
                    {j.projects.map((p) => p.name).join(", ")}
                  </TableCell>
                  <TableCell>
                    {j.sector && (
                      <Badge
                        variant="outline"
                        className="rounded-pill text-caption font-normal"
                      >
                        {j.sector}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-body">
                    {j.latest?.overall ?? "—"}
                    <span className="ml-1">
                      <TrendCell value={j.trends.overall} />
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <TrendCell value={j.trends.decision_making} />
                  </TableCell>
                  <TableCell className="text-right">
                    <TrendCell value={j.trends.insights} />
                  </TableCell>
                  <TableCell className="text-right">
                    <TrendCell value={j.trends.judgement} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/manager/juniors/$juniorId"
                      params={{ juniorId: j.id }}
                      className="inline-flex text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
