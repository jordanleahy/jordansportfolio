
import React from 'react';
import Navigation from '@/components/Navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {showNavigation && (
            <header className="sticky top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <SidebarTrigger className="mr-4" />
                <Navigation />
              </div>
            </header>
          )}
          
          <main className="relative flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
