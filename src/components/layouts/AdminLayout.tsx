import React from 'react';
import { Outlet } from 'react-router-dom';
import { ModalProvider } from '@/contexts/ModalContext';
import { SettingsModal } from '@/components/modals/SettingsModal';

export function AdminLayout() {
  return (
    <ModalProvider>
      <div className="min-h-screen">
        <main>
          <Outlet />
        </main>
      </div>
      <SettingsModal />
    </ModalProvider>
  );
}