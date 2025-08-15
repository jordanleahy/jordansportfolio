import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { ImageIcon, Loader2, Crown } from 'lucide-react';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardHeroImageProps {
  post: SocialMediaPost;
  colorTheme?: { name: string };
  isProcessing?: boolean;
  onPostsChange?: () => void;
  onGenerateImage?: (postId: string, aspectRatio: '1_1', title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export const PostCardHeroImage: React.FC<PostCardHeroImageProps> = ({
  post,
  colorTheme,
  isProcessing,
  onPostsChange,
  onGenerateImage
}) => {
  const navigate = useNavigate();
  const { getCreditStatus } = useCreditCheck();
  const { isProcessing: isGeneratingImage } = useProcessingStatesContext();
  const creditStatus = getCreditStatus();

  const handleGenerate = async () => {
    if (!creditStatus.hasCredits && !creditStatus.isLoading) {
      navigate('/subscription');
      return;
    }
    
    if (onGenerateImage) {
      await onGenerateImage(post.id, '1_1', post.title, post.description, post.category);
    }
  };

  const isCurrentlyGenerating = isGeneratingImage(post.id, 'generate', '1:1');
  const isLoading = isCurrentlyGenerating || isProcessing || (post.image_1_1_status === 'processing');

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
          <div 
            className="bg-muted w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={handleGenerate}
            role="button"
            tabIndex={0}
            aria-label={!creditStatus.hasCredits && !creditStatus.isLoading ? "Upgrade to continue" : "Generate image"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGenerate();
              }
            }}
          >
            {isCurrentlyGenerating ? (
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-medium">Generating...</p>
              </div>
            ) : !creditStatus.hasCredits && !creditStatus.isLoading ? (
              <div className="text-center">
                <Crown className="h-8 w-8 mx-auto mb-2 text-accent" />
                <p className="text-sm font-medium text-foreground">Upgrade to Continue</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Get unlimited AI generations
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Generate Image</p>
                <p className="text-xs opacity-75 mt-1">
                  {creditStatus.isLoading ? 'Checking credits...' : 'Click to generate'}
                </p>
              </div>
            )}
          </div>
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