import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStates } from '@/hooks/useProcessingStates';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';
import type { BulkImageGenerationButtonProps } from '@/types/stories/ui';

export const BulkImageGenerationButton: React.FC<BulkImageGenerationButtonProps> = ({
  post,
  onPostsChange,
}) => {
  const { generateAllImages, progress } = useBulkImageGeneration();
  const { isGenerating, setBulkProcessing } = useProcessingStates();
  const { data: subData } = useSubscriptionStatus();
  const { toast } = useToast();
  
  // Check if user has remaining credits
  const hasCredits = subData ? (subData.subscription?.tier?.max_gpt_images || 0) - (subData.usage?.gpt_images_used || 0) > 0 : true;
  
  const isCurrentlyGenerating = isGenerating(post.id);

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    if (!hasCredits) {
      toast({
        title: "No credits remaining",
        description: "You've used all your daily image generation credits. Credits reset at midnight.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setBulkProcessing(post.id, true);
      
      // Force a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const request: BulkImageGenerationRequest = {
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        context: 'table',
        colorThemeId: post.color_theme_id || undefined
      };

      const response = await generateAllImages(request);

      // Refresh the post data to show the new images
      if (response.success && onPostsChange) {
        const { data: refreshedPosts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('day', { ascending: true });
        
        if (refreshedPosts) {
          onPostsChange(refreshedPosts as SocialMediaPost[]);
        }
      }
      
    } catch (error) {
      console.error('Bulk image generation error:', error);
    } finally {
      setBulkProcessing(post.id, false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerateAllImages}
        disabled={isCurrentlyGenerating || !hasCredits}
        variant="outline"
        size="sm"
        className={`h-8 flex-1 ${!hasCredits ? 'opacity-50' : ''}`}
        title={!hasCredits ? "No credits remaining" : "Generate All Images with AI"}
      >
        {isCurrentlyGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className={`h-4 w-4 ${!hasCredits ? 'opacity-50' : ''}`} />
        )}
      </Button>
      
      {/* Skeleton Grid - shown during generation */}
      {isCurrentlyGenerating && (
          <div className="mt-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
              <div className="h-16 w-full">
                <Skeleton className="w-full h-full rounded border" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Generating images... {progress.currentAspectRatio || 'Preparing'}
            </p>
          </div>
      )}
    </>
  );
};