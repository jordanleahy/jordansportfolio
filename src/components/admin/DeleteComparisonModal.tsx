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
} from "@/components/ui/alert-dialog";

interface DeleteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  comparisonTitle: string;
  isDeleting?: boolean;
}

export const DeleteComparisonModal: React.FC<DeleteComparisonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  comparisonTitle,
  isDeleting = false
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Comparison</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{comparisonTitle}"</strong>? 
            This action cannot be undone and will permanently remove this comparison page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Comparison'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};