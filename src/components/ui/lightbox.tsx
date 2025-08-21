import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Image {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
}

interface MediaItem {
  type: 'image' | 'iframe';
  src: string; // For images, this is the image URL. For iframes, this is the iframe URL
  alt: string;
  caption?: string;
  title?: string;
  thumbnailSrc?: string; // For iframes, use this for thumbnail. For images, falls back to src
}

interface LightboxProps {
  images: Image[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

interface MediaLightboxProps {
  media: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

// Helper function to convert Image to MediaItem
const imageToMediaItem = (image: Image): MediaItem => ({
  type: 'image',
  src: image.src,
  alt: image.alt,
  caption: image.caption,
  title: image.title,
  thumbnailSrc: image.src
});

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  // Convert images to MediaItems for internal use
  const media = images.map(imageToMediaItem);
  
  return (
    <MediaLightbox 
      media={media}
      isOpen={isOpen}
      onClose={onClose}
      initialIndex={initialIndex}
    />
  );
};

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  media,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const isIframe = currentMedia.type === 'iframe';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-[95vw] max-h-[95vh] p-0 border-0",
        isIframe ? "bg-background" : "bg-black/95"
      )}>
        <div className="relative flex items-center justify-center h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-4 right-4 z-10",
              isIframe ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/20"
            )}
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                  isIframe ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/20"
                )}
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                  isIframe ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/20"
                )}
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Main content */}
          <div className="flex flex-col items-center justify-center max-w-full max-h-full p-8">
            {isIframe ? (
              <iframe
                src={currentMedia.src}
                title={currentMedia.alt}
                className="w-full max-w-[85vw] h-[80vh] border-0 rounded-lg"
                allowFullScreen
              />
            ) : (
              <img
                src={currentMedia.src}
                alt={currentMedia.alt}
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
            
            {/* Caption */}
            {currentMedia.caption && (
              <div className="mt-4 text-center">
                <p className={cn(
                  "text-sm max-w-2xl",
                  isIframe ? "text-foreground" : "text-white"
                )}>{currentMedia.caption}</p>
              </div>
            )}
            
            {/* Media counter */}
            {media.length > 1 && (
              <div className={cn(
                "mt-4 text-sm",
                isIframe ? "text-muted-foreground" : "text-white/80"
              )}>
                {currentIndex + 1} of {media.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {media.map((mediaItem, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                    index === currentIndex 
                      ? "border-primary" 
                      : "border-border opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={mediaItem.thumbnailSrc || mediaItem.src}
                    alt={mediaItem.alt}
                    className="w-full h-full object-cover"
                  />
                  {mediaItem.type === 'iframe' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[4px] border-l-black border-y-[2px] border-y-transparent ml-[1px]" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ImageThumbnailsProps {
  images: Image[];
  className?: string;
}

export const ImageThumbnails: React.FC<ImageThumbnailsProps> = ({
  images,
  className = ""
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative w-32 h-24 rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:scale-105 group"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            {image.title && (
              <div className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {image.title}
              </div>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={selectedIndex}
      />
    </>
  );
};

interface MediaThumbnailsProps {
  media: MediaItem[];
  className?: string;
}

export const MediaThumbnails: React.FC<MediaThumbnailsProps> = ({
  media,
  className = ""
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  if (!media || media.length === 0) return null;

  return (
    <>
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {media.map((mediaItem, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative w-32 h-24 rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:scale-105 group"
          >
            <img
              src={mediaItem.thumbnailSrc || mediaItem.src}
              alt={mediaItem.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            {/* Iframe play indicator */}
            {mediaItem.type === 'iframe' && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[3px] border-y-transparent ml-[1px]" />
              </div>
            )}
            
            {mediaItem.title && (
              <div className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {mediaItem.title}
              </div>
            )}
          </button>
        ))}
      </div>

      <MediaLightbox
        media={media}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={selectedIndex}
      />
    </>
  );
};