import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FolderOpen,
  GraduationCap,
  BookOpen,
  Upload,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Cases", url: "/cases", icon: FolderOpen },
];

const curriculumChildren = [
  { title: "Challenge", url: "/curriculum", icon: BookOpen },
  { title: "Senior Upload", url: "/curriculum/upload", icon: Upload },
  { title: "Manager Dashboard", url: "/curriculum/manager", icon: LayoutDashboard },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url;
  const inCurriculum = pathname.startsWith("/curriculum");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3v18" />
              <path d="M3 8h6" />
              <path d="M3 14h6" />
              <path d="M14 4h6l-3 6 3 0a3 3 0 1 1-6 0" />
            </svg>
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-body font-medium text-sidebar-foreground">
              Judgment ledger
            </div>
            <div className="text-caption text-muted-foreground">
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
                    className="rounded-md"
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      <span className="text-body">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={inCurriculum}
                  className="rounded-md"
                >
                  <Link to="/curriculum" className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-body">Learning Curriculum</span>
                  </Link>
                </SidebarMenuButton>
                {inCurriculum && (
                  <SidebarMenuSub>
                    {curriculumChildren.map((child) => (
                      <SidebarMenuSubItem key={child.url}>
                        <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                          <Link to={child.url} className="flex items-center gap-2">
                            <child.icon className="h-3.5 w-3.5" />
                            <span>{child.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
