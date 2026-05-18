import { Link, useRouterState } from "@tanstack/react-router";

function Tab({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        "relative inline-flex items-center px-1 pb-3 pt-3 text-body transition-colors",
        active
          ? "text-accent"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
        />
      )}
    </Link>
  );
}

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAnalytics = pathname === "/";
  const isCases = pathname.startsWith("/cases");

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-8 px-8 pt-5">
        <div className="flex items-center gap-3 pb-4">
          <div
            aria-hidden="true"
            className="flex h-[30px] w-[30px] items-center justify-center bg-accent text-accent-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3v18" />
              <path d="M3 8h6" />
              <path d="M3 14h6" />
              <path d="M14 4h6l-3 6 3 0a3 3 0 1 1-6 0" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-body text-foreground">Judgment ledger</div>
            <div className="text-caption text-muted-foreground">
              Investment case reviews
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-8">
          <Tab to="/" label="Dashboard" active={isDashboard} />
          <Tab to="/cases" label="Cases" active={isCases} />
        </nav>
      </div>
    </header>
  );
}
