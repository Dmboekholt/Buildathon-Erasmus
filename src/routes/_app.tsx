import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card pl-3">
            <SidebarTrigger />
            <a
              href="mailto:insight@bdo.com"
              className="flex h-14 items-center bg-primary px-8 text-[15px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Contact
            </a>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
