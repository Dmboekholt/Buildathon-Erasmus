import { Link } from "@tanstack/react-router";

type NavItem = { label: string; to: string };

const items: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Judgments", to: "/judgments" },
  { label: "Evidence", to: "/evidence" },
  { label: "Reports", to: "/reports" },
];

export function TopNav() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1200px] items-start justify-between px-8 pt-6 pb-0">
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="mt-1 flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-accent text-accent-foreground"
          >
            {/* Small ledger / scales glyph */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M8 2v12M3 5h10M4 5l-2 4a3 3 0 0 0 6 0L6 5M12 5l-2 4a3 3 0 0 0 6 0l-2-4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-section leading-none text-foreground">
              Judgment ledger
            </span>
            <span className="mt-1 text-caption text-muted-foreground">
              Audit-grade decision records for finance teams
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="h-9 rounded-sm border border-border bg-secondary px-3 text-caption text-foreground hover:bg-background"
          >
            Export
          </button>
          <button
            type="button"
            className="h-9 rounded-sm bg-accent px-3 text-caption text-accent-foreground hover:opacity-90"
          >
            New judgment
          </button>
        </div>
      </div>

      <nav className="mx-auto mt-6 flex max-w-[1200px] gap-6 px-8">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="border-b-2 border-transparent pb-3 text-body text-muted-foreground hover:text-foreground"
            activeProps={{
              className:
                "border-b-2 border-accent pb-3 text-body text-accent",
            }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
