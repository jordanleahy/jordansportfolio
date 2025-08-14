import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useToast } from '@/hooks/use-toast';
import { useIndividualPromptCache } from '@/hooks/useIndividualPromptCache';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';
import type { BulkImageGenerationButtonProps } from '@/types/stories/ui';
import { useParams } from 'react-router-dom';

export const BulkImageGenerationButton: React.FC<BulkImageGenerationButtonProps> = ({
  post,
  onPostsChange,
}) => {
  const { generateAllImages, progress } = useBulkImageGeneration();
  const { isGenerating, setBulkProcessing } = useProcessingStatesContext();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();
  const { toast } = useToast();
  
  const creditStatus = getCreditStatus();
  
  const params = useParams();
  const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  const themeId = theme;
  
  const isCurrentlyGenerating = isGenerating(post.id);
  
  // Use the same hook that checks fresh database data
  const { hasPrompt: hasIndividualPrompt } = useIndividualPromptCache(post.id, themeId);
  
  console.log('⚡ [BulkImageGenerationButton] Component state', {
    postId: post.id,
    postTitle: post.title,
    hasIndividualPrompt,
    hasIndividualPromptFresh: hasIndividualPrompt, // Fresh from database
    hasIndividualPromptStale: !!post.generated_image_prompt, // Stale from prop
    generatedPromptLength: post.generated_image_prompt?.length || 0,
    isCurrentlyGenerating,
    hasCredits: creditStatus.hasCredits,
    isLoading: creditStatus.isLoading
  });

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    // Check if individual prompt exists first
    if (!hasIndividualPrompt) {
      console.log('⚡ [BulkImageGenerationButton] Blocking bulk generation - no individual prompt', {
        postId: post.id,
        hasIndividualPrompt,
        generatedPrompt: post.generated_image_prompt
      });
      toast({
        title: "Individual prompt required",
        description: "Please wait for the individual image prompt to be generated first, then try bulk generation.",
        variant: "destructive"
      });
      return;
    }
    
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
        theme,
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
        disabled={isCurrentlyGenerating || !creditStatus.hasCredits || creditStatus.isLoading || !hasIndividualPrompt}
        variant="outline"
        size="sm"
        className={`h-8 flex-1 ${!creditStatus.hasCredits || !hasIndividualPrompt ? 'opacity-50' : ''}`}
        title={
          !creditStatus.hasCredits ? getBlockingMessage(creditStatus) : 
          !hasIndividualPrompt ? "Waiting for individual prompt generation..." :
          "Bulk Generate"
        }
      >
        {isCurrentlyGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className={`h-4 w-4 ${!creditStatus.hasCredits || !hasIndividualPrompt ? 'opacity-50' : ''}`} />
        )}
      </Button>
      
      {/* Skeleton Grid - shown during generation */}
      {isCurrentlyGenerating && (
          <div className="mt-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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