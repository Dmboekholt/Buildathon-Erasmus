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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import bdoLogo from "@/assets/bdo-logo.png";

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
          <img
            src={bdoLogo}
            alt="BDO"
            className="h-8 w-auto shrink-0 object-contain"
          />
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[16px] font-bold uppercase tracking-tight text-[#1a2b4a]">
              Judgment Ledger
            </div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
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
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col gap-2 px-2 py-4 group-data-[collapsible=icon]:hidden">
          <span className="eyebrow">Powered by</span>
          <img src={bdoLogo} alt="BDO" className="h-5 w-auto object-contain" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
