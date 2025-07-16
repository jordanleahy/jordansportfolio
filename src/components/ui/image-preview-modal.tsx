import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ImagePreviewModal = ({ isOpen, onClose, imageUrl, alt }: ImagePreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <OptimizedImage
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};