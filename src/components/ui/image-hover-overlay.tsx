import React, { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Upload, Eye, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageHoverOverlayProps {
  children: ReactNode;
  onUpload?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  imageUrl?: string | null;
  className?: string;
  showUpload?: boolean;
  showView?: boolean;
  showDownload?: boolean;
  showDelete?: boolean;
}

export const ImageHoverOverlay = ({
  children,
  onUpload,
  onView,
  onDownload,
  onDelete,
  imageUrl,
  className,
  showUpload = true,
  showView = true,
  showDownload = true,
  showDelete = true,
}: ImageHoverOverlayProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = async () => {
    if (imageUrl && onDownload) {
      onDownload();
    } else if (imageUrl) {
      try {
        // Fetch the image as a blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Extract filename from URL or use a default
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1] || 'image.jpg';
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback to simple link download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = imageUrl.split('/').pop() || 'image.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Desktop floating tooltip icons - hidden on mobile */}
      <div
        className={cn(
          "absolute top-2 right-2 flex flex-row gap-1 transition-all duration-300 hidden md:flex z-10",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
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
            className={cn(
              "h-8 w-8 p-0 bg-black/80 hover:bg-black text-white shadow-lg rounded-full transition-all duration-200",
              isHovered ? "delay-75" : ""
            )}
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
            className={cn(
              "h-8 w-8 p-0 bg-black/80 hover:bg-black text-white shadow-lg rounded-full transition-all duration-200",
              isHovered ? "delay-100" : ""
            )}
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
            className={cn(
              "h-8 w-8 p-0 bg-black/80 hover:bg-black text-white shadow-lg rounded-full transition-all duration-200",
              isHovered ? "delay-150" : ""
            )}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        
        {showDelete && onDelete && imageUrl && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              "h-8 w-8 p-0 bg-destructive/80 hover:bg-destructive text-white shadow-lg rounded-full transition-all duration-200",
              isHovered ? "delay-200" : ""
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};