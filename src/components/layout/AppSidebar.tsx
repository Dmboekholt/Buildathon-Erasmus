import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Cases", url: "/cases", icon: FolderOpen },
  { title: "Manager Dashboard", url: "/manager", icon: LayoutDashboard },
  { title: "Learning Curriculum", url: "/curriculum", icon: GraduationCap },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-4">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1a2b4a]"
          >
            <span className="text-[13px] font-bold tracking-tight text-white">JL</span>
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[18px] font-bold uppercase tracking-tight text-[#1a2b4a]">
              Judgment Ledger
            </div>
            <div className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
              Investment case reviews
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="eyebrow px-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="rounded-none font-bold uppercase tracking-[0.04em] text-[13px]"
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
