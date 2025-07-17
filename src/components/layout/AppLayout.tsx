import React from 'react';
import Navigation from '@/components/Navigation';

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
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;