import React from 'react';
import Navigation from '@/components/Navigation';
import { ModalProvider } from '@/contexts/ModalContext';
import { SettingsModal } from '@/components/modals/SettingsModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ModalProvider>
      <div className="min-h-screen">
        <Navigation />
        <main className="p-6">
          {children}
        </main>
      </div>
      <SettingsModal />
    </ModalProvider>
  );
}