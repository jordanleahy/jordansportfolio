import React from 'react';
import Navigation from '@/components/Navigation';
import SubNavigation from '@/components/SubNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  return (
    <div className="min-h-screen bg-background">
      {showNavigation && <Navigation />}
      {showNavigation && <SubNavigation />}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;