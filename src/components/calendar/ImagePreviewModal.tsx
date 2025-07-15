import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt: string;
}

export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt
}: ImagePreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/90"
        onPointerDownOutside={onClose}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Image */}
          <div className="flex items-center justify-center p-4 w-full h-full">
            <OptimizedImage
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};