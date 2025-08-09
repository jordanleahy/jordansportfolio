import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmRegenerateDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  dateLabel: string;
  isGenerating?: boolean;
}

export const ConfirmRegenerateDialog: React.FC<ConfirmRegenerateDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  dateLabel,
  isGenerating = false,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="animate-enter">
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate this summary?</AlertDialogTitle>
          <AlertDialogDescription>
            A summary for {dateLabel} already exists. Regenerating will replace the existing one.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel} disabled={isGenerating}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm} disabled={isGenerating}>
              {isGenerating ? 'Regenerating…' : 'Regenerate'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmRegenerateDialog;
