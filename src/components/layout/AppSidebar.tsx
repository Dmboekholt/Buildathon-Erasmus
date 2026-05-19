import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, FolderOpen, GraduationCap } from "lucide-react";
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
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { BdoLogo } from "@/components/brand/BdoLogo";

const items = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Cases", url: "/cases", icon: FolderOpen },
  { title: "Learning Curriculum", url: "/curriculum", icon: GraduationCap },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center px-3 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
          <BdoLogo className="h-7 w-auto group-data-[collapsible=icon]:h-5" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="eyebrow px-3">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="rounded-none"
                    >
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 border-l-2 ${
                          active
                            ? "border-l-primary text-primary"
                            : "border-l-transparent text-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-[15px] font-bold uppercase tracking-[0.05em]">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <WorkspaceSwitcher mode="junior" />
      </SidebarFooter>
    </Sidebar>
  );
}
