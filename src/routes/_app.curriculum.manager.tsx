import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/curriculum/manager")({
  component: ManagerDashboardPage,
});

function ManagerDashboardPage() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <h3 className="text-section font-medium text-foreground">Manager Dashboard</h3>
      <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
        Team progression, cohort analytics, and reviewer tooling will appear here in a later module.
      </p>
    </div>
  );
}
