import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopNav } from "@/components/layout/TopNav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
