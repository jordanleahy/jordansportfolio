
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems } from "@/nav-items";
import { Scale } from "lucide-react";

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/" && !location.hash;
    if (path.includes("#")) {
      const [basePath, hash] = path.split('#');
      return currentPath === basePath && location.hash === `#${hash}`;
    }
    return currentPath.startsWith(path);
  };

  // Filter and customize nav items for sidebar
  const sidebarItems = [
    ...navItems.filter(item => 
      item.to !== "/auth" && 
      item.to !== "/comparisons" // Remove the old comparisons item
    ),
    {
      title: "Comparison",
      to: "/comparisons",
      icon: <Scale className="h-4 w-4" />,
    }
  ];

  return (
    <Sidebar className={sidebarState === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/50"
                      }
                    >
                      {item.icon}
                      {sidebarState !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
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
