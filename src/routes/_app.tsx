import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        "flex items-center gap-3 rounded-sm px-3 py-2 text-body transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      <Icon className={["h-4 w-4", active ? "text-accent" : ""].join(" ")} />
      <span>{label}</span>
    </Link>
  );
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isTasks = pathname.startsWith("/tasks");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center bg-accent text-accent-foreground">
            <span className="font-mono text-caption font-medium">BDO</span>
          </div>
          <div className="leading-tight">
            <div className="text-body text-foreground">BDO Coach</div>
            <div className="text-caption text-muted-foreground">
              Junior debriefs
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavItem to="/" label="Home" icon={Home} active={isHome} />
          <NavItem
            to="/tasks"
            label="Tasks"
            icon={ListChecks}
            active={isTasks}
          />
        </nav>

        <div className="border-t border-border px-5 py-4">
          <div className="text-caption text-muted-foreground">Signed in as</div>
          <div className="text-body text-foreground">Sam Patel</div>
        </div>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
