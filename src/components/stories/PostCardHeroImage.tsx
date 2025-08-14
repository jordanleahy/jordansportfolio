import React from 'react';
import { Button } from '@/components/ui/button';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { ImageIcon, Loader2 } from 'lucide-react';
import { usePromptValidatedImageGeneration } from '@/hooks/usePromptValidatedImageGeneration';
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
  const { isGenerating, generationStep, generateHeroImage, creditStatus, steps } = usePromptValidatedImageGeneration();

  const handleGenerate = () => {
    generateHeroImage(post, colorTheme, onPostsChange);
  };

  const isLoading = isGenerating || isProcessing || (post.image_1_1_status === 'processing');

  return (
    <div className="h-full">
      {/* Hero Image Display */}
      <div className="aspect-square md:aspect-[4/3] h-full overflow-hidden relative">
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
              <p className="text-sm">Hero Image</p>
            </div>
          </div>
        )}
        
        {/* Generate Button Overlay - positioned over image */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
          <Button
            variant="outline"
            size="sm"
            className={`w-full bg-background/90 backdrop-blur-sm ${isLoading ? 'animate-pulse' : ''}`}
            onClick={handleGenerate}
            disabled={isLoading || creditStatus.isLoading || !creditStatus.hasCredits}
            title={!creditStatus.hasCredits ? 'No credits available' : creditStatus.isLoading ? "Checking credits..." : undefined}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium">{generationStep}</span>
                  {steps && (
                    <div className="flex gap-1 mt-1">
                      <div className={`w-2 h-1 rounded-full ${
                        steps.promptValidation === 'complete' ? 'bg-primary' : 
                        steps.promptValidation === 'active' ? 'bg-primary/60' : 
                        steps.promptValidation === 'error' ? 'bg-destructive' : 'bg-muted'
                      }`} />
                      <div className={`w-2 h-1 rounded-full ${
                        steps.promptGeneration === 'complete' ? 'bg-primary' : 
                        steps.promptGeneration === 'active' ? 'bg-primary/60' : 
                        steps.promptGeneration === 'error' ? 'bg-destructive' : 'bg-muted'
                      }`} />
                      <div className={`w-2 h-1 rounded-full ${
                        steps.imageGeneration === 'complete' ? 'bg-primary' : 
                        steps.imageGeneration === 'active' ? 'bg-primary/60' : 
                        steps.imageGeneration === 'error' ? 'bg-destructive' : 'bg-muted'
                      }`} />
                      <div className={`w-2 h-1 rounded-full ${
                        steps.imageUpload === 'complete' ? 'bg-primary' : 
                        steps.imageUpload === 'active' ? 'bg-primary/60' : 
                        steps.imageUpload === 'error' ? 'bg-destructive' : 'bg-muted'
                      }`} />
                    </div>
                  )}
                </div>
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
    </div>
  );
};