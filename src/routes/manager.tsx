import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ManagerSidebar } from "@/components/layout/ManagerSidebar";

export const Route = createFileRoute("/manager")({
  component: ManagerLayout,
});

function ManagerLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ManagerSidebar />
        <div className="flex min-h-screen flex-1 flex-col bg-muted">
          <header className="flex h-12 shrink-0 items-center border-b border-border bg-card px-3">
            <SidebarTrigger />
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
