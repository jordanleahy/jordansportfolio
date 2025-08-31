import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { UnifiedLoadingIndicator } from '@/components/ui/unified-loading-indicator';
import { ImageVersionThumbnails } from '@/components/ui/image-version-thumbnails';
import { useImageVersions } from '@/hooks/useImageVersions';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { cn } from '@/lib/utils';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatio } from '@/types/bulkImageGeneration';

interface PostImageWithVersionsProps {
  post: SocialMediaPost;
  selectedImage: string | null;
  selectedAspectRatio: string | null;
  isProcessing: boolean;
  regenerateStates: Map<string, any>;
  handleRegenerateImage: (post: SocialMediaPost, e: React.MouseEvent) => void;
  onPreviewImage: (url: string, alt: string) => void;
  onGenerateImage: (postId: string, aspectRatio: string, title: string, description: string, category: string) => void;
  isProcessingCtx: (postId: string, operation?: 'generate' | 'bulk_generate' | 'regenerate_prompt', aspectRatio?: AspectRatio) => boolean;
  secondsRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
}

export const PostImageWithVersions = memo(({
  post,
  selectedImage,
  selectedAspectRatio,
  isProcessing,
  regenerateStates,
  handleRegenerateImage,
  onPreviewImage,
  onGenerateImage,
  isProcessingCtx,
  secondsRemaining,
  isRunning,
  isExpired
}: PostImageWithVersionsProps) => {
  // Hooks must be called at component level, not inside conditional logic
  const imageVersions = useImageVersions(selectedImage || '', '1:1');
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: imageVersions.goToNextVersion,
    onSwipeRight: imageVersions.goToPreviousVersion,
    threshold: 50,
    preventScroll: true
  });

  return (
    <div className="space-y-2">
      <div 
        className="aspect-square relative group bg-muted rounded-md overflow-hidden"
        ref={swipeGestures.ref}
      >
        {selectedImage ? (
          <div className="relative w-full h-full">
            <img 
              src={imageVersions.currentImageUrl}
              alt={`${post.title} - ${selectedAspectRatio}`}
              className={cn(
                "object-cover w-full h-full cursor-pointer hover:opacity-90 transition-all duration-200",
                imageVersions.isLoading && "opacity-50"
              )}
              onClick={() => onPreviewImage(imageVersions.currentImageUrl, `${post.title} - ${selectedAspectRatio}`)}
            />
            
            {/* Version indicator for multiple versions */}
            {imageVersions.hasMultipleVersions && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                {imageVersions.currentVersionIndex + 1} of {imageVersions.imageVersions.length}
              </div>
            )}
            
            {/* Loading overlay */}
            {imageVersions.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Regenerate button overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                onClick={(e) => handleRegenerateImage(post, e)}
                disabled={regenerateStates.get(post.id)?.isDisabled}
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/90 hover:bg-background border border-border rounded-md px-3 py-1 text-sm text-foreground hover:text-primary transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate image"
              >
                {regenerateStates.get(post.id)?.buttonText}
              </button>
            </div>
          </div>
        ) : (isProcessing || isProcessingCtx(post.id, 'generate', '1:1' as AspectRatio)) ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <SimpleShimmer className="absolute inset-0 w-full h-full" />
            <UnifiedLoadingIndicator 
              isVisible={true}
              variant="overlay"
              message={regenerateStates.get(post.id)?.loadingMessage}
              timerSeconds={secondsRemaining}
              showTimer={isRunning}
              isTimerExpired={isExpired}
            />
          </div>
        ) : (
          <button
            onClick={() => {
              // Start with 1:1 aspect ratio as default
              onGenerateImage(post.id, '1_1', post.title, post.description, post.category);
            }}
            disabled={regenerateStates.get(post.id)?.isDisabled}
            className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors group-hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>{regenerateStates.get(post.id)?.buttonText}</span>
            </div>
          </button>
        )}
      </div>
      
      {/* Image Version Thumbnails */}
      <ImageVersionThumbnails
        versions={imageVersions.imageVersions}
        currentIndex={imageVersions.currentVersionIndex}
        onVersionSelect={imageVersions.goToVersion}
        className="justify-center"
      />
    </div>
  );
});

PostImageWithVersions.displayName = 'PostImageWithVersions';