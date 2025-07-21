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
      <div className={`pt-8 md:pt-16 ${className}`}>
        {children}
      </div>
    </AppLayout>
  );
};

export default PageLayout;