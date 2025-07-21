
import React from 'react';
import Navigation from '@/components/Navigation';
import OptimizedSubNavigation from '@/components/OptimizedSubNavigation';

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
      {showNavigation && <OptimizedSubNavigation />}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
