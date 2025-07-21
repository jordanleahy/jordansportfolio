import React from 'react';
import AppLayout from './AppLayout';

interface PageLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showNavigation = true,
  className = ""
}) => {
  return (
    <AppLayout showNavigation={showNavigation}>
      <div className={className}>
        {children}
      </div>
    </AppLayout>
  );
};

export default PageLayout;