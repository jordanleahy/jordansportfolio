import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThemeCoverImageSelector } from './ThemeCoverImageSelector';
import { Theme } from '@/types/stories/domain';

interface ThemeManagementModalProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ThemeManagementModal({ theme, isOpen, onClose, onUpdate }: ThemeManagementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage "{theme.theme_name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <ThemeCoverImageSelector 
            theme={theme} 
            onUpdate={() => {
              onUpdate();
              onClose();
            }} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}