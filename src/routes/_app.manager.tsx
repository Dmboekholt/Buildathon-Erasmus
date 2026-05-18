import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/manager")({
  component: ManagerDashboardPage,
});

function ManagerDashboardPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-16">
      <header className="mb-10">
        <div className="eyebrow mb-4">03. Manager dashboard</div>
        <h1 className="font-display text-[44px] leading-[48px] tracking-[-0.025em] text-foreground">
          Team progression
          <br />
          <span className="text-muted-foreground">at a glance.</span>
        </h1>
      </header>
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <h3 className="text-section font-medium text-foreground">Manager Dashboard</h3>
        <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
          Team progression, cohort analytics, and reviewer tooling will appear here in a later module.
        </p>
      </div>
    </div>
  );
}
