import React from 'react';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { InstantLoadingIndicator } from '@/components/ui/instant-loading-indicator';
import { ImageIcon, Sparkles } from 'lucide-react';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useToast } from '@/hooks/use-toast';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardHeroImageProps {
  post: SocialMediaPost;
  colorTheme?: { name: string };
  isProcessing?: boolean;
  onGenerateImage?: (postId: string, aspectRatio: string, title: string, description: string, category?: string) => void;
  onPreviewImage?: (imageUrl: string, title: string) => void;
}

export const PostCardHeroImage: React.FC<PostCardHeroImageProps> = ({
  post,
  isProcessing,
  onGenerateImage,
  onPreviewImage
}) => {
  const { isProcessing: isProcessingCtx } = useProcessingStatesContext();
  const { getCreditStatus, getBlockingMessage } = useCreditCheck();
  const { toast } = useToast();
  
  const selectedImage = post.image_1_1_url;
  const selectedAspectRatio = '1:1';
  const isLoadingOrProcessing = isProcessing || (post.image_1_1_status === 'processing') || isProcessingCtx(post.id, 'generate');

  return (
    <div className="space-y-4">
      {/* Hero Image Display */}
      <div className="aspect-square relative group bg-muted rounded-t-lg overflow-hidden">
        {isLoadingOrProcessing ? (
          <div className="relative w-full h-full">
            {selectedImage && (
              <img 
                src={selectedImage}
                alt={`${post.title} - ${selectedAspectRatio}`}
                className="object-cover w-full h-full"
              />
            )}
            <div className="absolute inset-0">
              <SimpleShimmer className="w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <InstantLoadingIndicator 
                  isVisible={true}
                  message={selectedImage ? "Regenerating..." : "Generating..."}
                  className="text-white drop-shadow-sm"
                />
              </div>
            </div>
          </div>
        ) : selectedImage ? (
          <div className="relative w-full h-full">
            <img 
              src={selectedImage}
              alt={`${post.title} - ${selectedAspectRatio}`}
              className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onPreviewImage?.(selectedImage, `${post.title} - ${selectedAspectRatio}`)}
            />
            {/* Regenerate button overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const creditStatus = getCreditStatus();
                  if (!creditStatus.hasCredits) {
                    toast({
                      title: "Credit limit reached",
                      description: getBlockingMessage(creditStatus),
                      variant: "destructive"
                    });
                    return;
                  }
                  // Always regenerate as 1:1 for square container
                  const aspectRatioKey = '1_1';
                  onGenerateImage?.(post.id, aspectRatioKey, post.title, post.description, post.category);
                }}
                disabled={isProcessingCtx(post.id, 'generate')}
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/90 hover:bg-background border border-border rounded-md px-3 py-1 text-sm text-foreground hover:text-primary transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate image"
              >
                {isProcessingCtx(post.id, 'generate') ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              // Start with 1:1 aspect ratio as default
              onGenerateImage?.(post.id, '1_1', post.title, post.description, post.category);
            }}
            disabled={isLoadingOrProcessing}
            className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors group-hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>Generate Image</span>
            </div>
          </button>
        )}
      </div>

      {/* Description */}
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {post.title || 'Untitled Post'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {post.description}
        </p>
      </div>
    </div>
  );
};