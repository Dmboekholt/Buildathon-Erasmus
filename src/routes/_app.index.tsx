import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <header className="mb-8">
        <h1 className="text-page-title text-foreground">Dashboard</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          Investment case reviews.
        </p>
      </header>

      <Link
        to="/cases"
        className="inline-flex h-10 items-center rounded-sm bg-accent px-4 text-body text-accent-foreground"
      >
        Browse cases
      </Link>
    </div>
  );
}
