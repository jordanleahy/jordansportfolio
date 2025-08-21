import React from 'react';
import { ModalProvider } from '@/contexts/ModalContext';
import { SettingsModal } from '@/components/modals/SettingsModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ModalProvider>
      <div className="min-h-screen">
        <main className="p-6">
          {children}
        </main>
      </div>
      <SettingsModal />
    </ModalProvider>
  );
}