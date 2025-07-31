import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  aspectRatio: string;
  label: string;
}

export const PostMediaGalleryModal = ({
  isOpen,
  onClose,
  post
}: PostMediaGalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Collect all media items
  const mediaItems: MediaItem[] = [];
  
  if (post.image_16_9_url) {
    mediaItems.push({
      url: post.image_16_9_url,
      type: 'image',
      aspectRatio: '16:9',
      label: 'Landscape (16:9)'
    });
  }
  
  if (post.image_9_16_url) {
    mediaItems.push({
      url: post.image_9_16_url,
      type: 'image',
      aspectRatio: '9:16',
      label: 'Portrait (9:16)'
    });
  }
  
  if (post.image_3_4_url) {
    mediaItems.push({
      url: post.image_3_4_url,
      type: 'image',
      aspectRatio: '3:4',
      label: 'Social (3:4)'
    });
  }
  
  if (post.image_4_3_url) {
    mediaItems.push({
      url: post.image_4_3_url,
      type: 'image',
      aspectRatio: '4:3',
      label: 'Standard (4:3)'
    });
  }
  
  if (post.image_16_9_video_url) {
    mediaItems.push({
      url: post.image_16_9_video_url,
      type: 'video',
      aspectRatio: '16:9',
      label: '16:9 Video'
    });
  }
  
  if (post.image_3_4_video_url) {
    mediaItems.push({
      url: post.image_3_4_video_url,
      type: 'video',
      aspectRatio: '3:4',
      label: '3:4 Video'
    });
  }
  
  if (post.general_video_url) {
    mediaItems.push({
      url: post.general_video_url,
      type: 'video',
      aspectRatio: '16:9',
      label: 'General Video'
    });
  }

  if (mediaItems.length === 0) return null;

  const currentMedia = mediaItems[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/95"
        onPointerDownOutside={onClose}
      >
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {currentMedia.label}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {currentIndex + 1} of {mediaItems.length}
              </Badge>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation buttons */}
          {mediaItems.length > 1 && (
            <>
              <Button
                onClick={goToPrevious}
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                onClick={goToNext}
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="flex items-center justify-center p-16 w-full h-full">
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`${currentMedia.label} for ${post.title}`}
                className="max-w-full max-h-full object-contain rounded"
                loading="lazy"
              />
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full object-contain rounded"
                style={{ aspectRatio: currentMedia.aspectRatio.replace(':', '/') }}
              />
            )}
          </div>

          {/* Thumbnail navigation */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex gap-2 bg-black/50 rounded-lg p-2">
                {mediaItems.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-12 h-12 rounded border-2 overflow-hidden transition-opacity ${
                      index === currentIndex 
                        ? 'border-white opacity-100' 
                        : 'border-white/30 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};