import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/layout/TopNav";
import { MetricCard } from "@/components/ui/MetricCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-[1200px] px-8 py-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-page-title text-foreground">Dashboard</h1>
          <span className="font-mono text-caption text-muted-foreground">
            Period 2026-05-01 — 2026-05-18
          </span>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Open judgments"
            value="42"
            hint="7 awaiting review"
          />
          <MetricCard
            label="Exposure under review"
            value="$1,284,500"
            emphasis
            hint="Across 12 entities"
          />
          <MetricCard
            label="Avg. resolution time"
            value="6.3d"
            hint="Down from 7.1d last period"
          />
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-section text-foreground">Recent judgments</h2>
            <span className="text-caption text-muted-foreground">
              Sorted by last update
            </span>
          </div>

          <div className="mt-4 rounded-md border border-border bg-card">
            <div className="flex flex-col items-center justify-center px-5 py-16">
              <p className="text-body text-muted-foreground">
                No judgments recorded yet.
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
                New entries will appear here once logged.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
