
import React from 'react';
import Navigation from '@/components/Navigation';
import { ModalProvider } from '@/contexts/ModalContext';
import { SettingsModal } from '@/components/modals/SettingsModal';


interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  return (
    <ModalProvider>
      <div className="min-h-screen bg-background">
        {showNavigation && <Navigation />}
        
        <main className="relative">
          {children}
        </main>
        
        <SettingsModal />
      </div>
    </ModalProvider>
  );
};

export default AppLayout;
