import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopImagePreviewModal } from "./desktop-image-preview-modal";
import { MobileImagePreviewModal } from "./mobile-image-preview-modal";

interface ResponsiveImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  aspectRatio?: string;
}

export const ResponsiveImagePreviewModal = (props: ResponsiveImagePreviewModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileImagePreviewModal {...props} />;
  }

  return <DesktopImagePreviewModal {...props} />;
};

// Export as default for backward compatibility
export { ResponsiveImagePreviewModal as ImagePreviewModal };