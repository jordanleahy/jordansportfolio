import React, { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Upload, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageHoverOverlayProps {
  children: ReactNode;
  onUpload?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  imageUrl?: string | null;
  className?: string;
  showUpload?: boolean;
  showView?: boolean;
  showDownload?: boolean;
}

export const ImageHoverOverlay = ({
  children,
  onUpload,
  onView,
  onDownload,
  imageUrl,
  className,
  showUpload = true,
  showView = true,
  showDownload = true,
}: ImageHoverOverlayProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = () => {
    if (imageUrl && onDownload) {
      onDownload();
    } else if (imageUrl) {
      // Default download behavior
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageUrl.split('/').pop() || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Desktop hover overlay - hidden on mobile */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity duration-200 hidden md:flex",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {showUpload && onUpload && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
        
        {showView && onView && imageUrl && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        
        {showDownload && imageUrl && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};