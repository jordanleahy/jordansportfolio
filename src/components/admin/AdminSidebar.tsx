import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Settings, BookOpen } from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getAdminItems } from '@/config/navigationConfig';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const adminItems = getAdminItems();

  // Check if any admin route is currently active
  const isAdminRouteActive = adminItems.some(item => 
    location.pathname.startsWith(item.href)
  );

  // Keep admin section open if any admin route is active
  React.useEffect(() => {
    if (isAdminRouteActive) {
      setIsAdminOpen(true);
    }
  }, [isAdminRouteActive]);

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-foreground">Jordan Leahy</span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/stories'}>
                  <Link to="/stories" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Stories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-2 py-2 h-8 text-sm font-medium",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isAdminRouteActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                  {isAdminOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-1">
                <SidebarMenu className="ml-4">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || 
                                   location.pathname.startsWith(item.href + '/');
                    
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link 
                            to={item.href} 
                            className="flex items-center gap-2 text-sm"
                          >
                            {item.label === "Funded Startups" ? (
                              <span className="text-sm font-bold">$$</span>
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
