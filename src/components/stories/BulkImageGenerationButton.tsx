import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStates } from '@/hooks/useProcessingStates';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useToast } from '@/hooks/use-toast';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';
import type { BulkImageGenerationButtonProps } from '@/types/stories/ui';

export const BulkImageGenerationButton: React.FC<BulkImageGenerationButtonProps> = ({
  post,
  onPostsChange,
}) => {
  const { generateAllImages, progress } = useBulkImageGeneration();
  const { isGenerating, setBulkProcessing } = useProcessingStates();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();
  const { toast } = useToast();
  
  const creditStatus = getCreditStatus();
  
  const isCurrentlyGenerating = isGenerating(post.id);

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    // Check credits before proceeding
    if (!creditStatus.hasCredits) {
      toast({
        title: "No credits remaining",
        description: getBlockingMessage(creditStatus),
        variant: "destructive"
      });
      return;
    }

    // Enforce usage limits (will show toast if limit exceeded)
    const usageCheck = await enforceUsage('gpt_image_generation', 4); // 4 images for bulk generation
    if (!usageCheck.allowed) {
      return; // Toast already shown by enforceUsage
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
        disabled={isCurrentlyGenerating || !creditStatus.hasCredits || creditStatus.isLoading}
        variant="outline"
        size="sm"
        className={`h-8 flex-1 ${!creditStatus.hasCredits ? 'opacity-50' : ''}`}
        title={!creditStatus.hasCredits ? getBlockingMessage(creditStatus) : "Generate All Images with AI"}
      >
        {isCurrentlyGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className={`h-4 w-4 ${!creditStatus.hasCredits ? 'opacity-50' : ''}`} />
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