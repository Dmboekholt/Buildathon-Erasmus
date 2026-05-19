import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { BdoLogo } from "@/components/brand/BdoLogo";

const navSections = [
  {
    label: "Current work",
    items: [
      { title: "Improvements", url: "/", icon: ClipboardList },
      { title: "Current work", url: "/cases", icon: FolderOpen },
    ],
  },
  {
    label: "Practice",
    items: [
      {
        title: "Practice dashboard",
        url: "/practice",
        icon: LayoutDashboard,
      },
      {
        title: "Learning curriculum",
        url: "/curriculum",
        icon: GraduationCap,
      },
    ],
  },
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
        {navSections.map((section, index) => (
          <div key={section.label}>
            {index > 0 && <SidebarSeparator className="my-4" />}
            <SidebarGroup className={index > 0 ? "mt-2" : undefined}>
              <SidebarGroupLabel className="px-3 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-primary">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          size="sm"
                          className="rounded-none"
                        >
                          <Link
                            to={item.url}
                            className={`flex items-center gap-2.5 border-l-2 ${
                              active
                                ? "border-l-primary text-primary"
                                : "border-l-transparent text-foreground"
                            }`}
                          >
                            <item.icon className="h-3.5 w-3.5" />
                            <span className="text-[13px] font-bold uppercase tracking-[0.05em]">
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
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <WorkspaceSwitcher mode="junior" />
      </SidebarFooter>
    </Sidebar>
  );
}
