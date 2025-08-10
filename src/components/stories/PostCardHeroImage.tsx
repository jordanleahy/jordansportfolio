import React from 'react';
import { Button } from '@/components/ui/button';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardHeroImageProps {
  post: SocialMediaPost;
  colorTheme?: { name: string };
  isProcessing?: boolean;
  onPostsChange?: () => void;
}

export const PostCardHeroImage: React.FC<PostCardHeroImageProps> = ({
  post,
  colorTheme,
  isProcessing,
  onPostsChange
}) => {
  const { isGenerating, generationStep, generateHeroImage, creditStatus } = useImageGeneration();

  const handleGenerate = () => {
    generateHeroImage(post, colorTheme, onPostsChange);
  };

  const isLoading = isGenerating || isProcessing || (post.image_1_1_status === 'processing');

  return (
    <div className="space-y-4">
      {/* Hero Image Display */}
      <div className="aspect-square rounded-t-lg overflow-hidden">
        {isLoading ? (
          <SimpleShimmer 
            variant="full"
            className="w-full h-full"
          />
        ) : post.image_1_1_url ? (
          <img
            src={post.image_1_1_url}
            alt="Hero image"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">1:1 Hero Image</p>
            </div>
          </div>
        )}
      </div>

      {/* Description and Generate Button */}
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {post.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          className={`mt-2 w-full ${isLoading ? 'animate-pulse' : ''}`}
          onClick={handleGenerate}
          disabled={isLoading || creditStatus.isLoading || !creditStatus.hasCredits}
          title={!creditStatus.hasCredits ? 'No credits available' : creditStatus.isLoading ? "Checking credits..." : undefined}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{generationStep}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ImageIcon className={`h-4 w-4 ${(!creditStatus.hasCredits || creditStatus.isLoading) ? 'opacity-50' : ''}`} />
              Generate
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};