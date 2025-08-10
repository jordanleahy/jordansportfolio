import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DuplicateThemeModalProps {
  open: boolean;
  category: string;
  theme: string;
  onConfirm: (newCategory: string) => void;
  onCancel: () => void;
}

export const DuplicateThemeModal: React.FC<DuplicateThemeModalProps> = ({ open, category, theme, onConfirm, onCancel }) => {
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (open) {
      // Default suggestion: append -2, slug-style
      const suggestion = `${category}`.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setNewCategory(suggestion ? `${suggestion}-2` : 'new-category');
    }
  }, [open, category]);

  const handleConfirm = () => {
    const slug = newCategory.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) return;
    onConfirm(slug);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Theme already exists</DialogTitle>
          <DialogDescription>
            A theme for the category "{category}" already exists. If this is a different topic, create it under a new category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">New category</label>
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="enter-new-category"
            aria-label="New category"
          />
          <p className="text-xs text-muted-foreground">Use lowercase, hyphens instead of spaces.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Create as new</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
