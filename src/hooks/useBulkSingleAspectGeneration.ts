import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';

interface BulkSingleAspectRequest {
  postIds: string[];
  aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
  category?: string;
  mode: 'missing_only' | 'regenerate_all';
}

interface BulkSingleAspectResponse {
  success: boolean;
  results: Array<{
    postId: string;
    success: boolean;
    url?: string;
    error?: string;
    cost: number;
    tokens: number;
  }>;
  failures: Array<{
    postId: string;
    success: boolean;
    error?: string;
    cost: number;
    tokens: number;
  }>;
  totalCost: number;
  totalTokens: number;
  imagesGenerated: number;
  processingTimeMs: number;
  aspectRatio: string;
  mode: string;
  postsProcessed: number;
  message?: string;
}

export const useBulkSingleAspectGeneration = () => {
  const { setProcessing } = useProcessingStatesContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const generateBulkSingleAspect = useCallback(async (
    posts: SocialMediaPost[],
    aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1',
    mode: 'missing_only' | 'regenerate_all',
    category?: string
  ): Promise<BulkSingleAspectResponse> => {
    if (isProcessing) {
      throw new Error('Bulk generation already in progress');
    }

    setIsProcessing(true);
    const postIds = posts.map(p => p.id);
    
    // Set processing state for all posts
    postIds.forEach(id => setProcessing(id, 'generate', true));

    try {
      // Validate posts have prompts for missing_only mode
      if (mode === 'missing_only') {
        const postsWithoutPrompts = posts.filter(p => !p.generated_image_prompt);
        if (postsWithoutPrompts.length > 0) {
          throw new Error(`${postsWithoutPrompts.length} posts are missing image prompts. Please generate prompts first.`);
        }
      }

      const request: BulkSingleAspectRequest = {
        postIds,
        aspectRatio,
        category,
        mode
      };

      console.log(`🚀 [BULK_SINGLE] Starting ${aspectRatio} generation for ${postIds.length} posts (mode: ${mode})`);

      const { data, error } = await supabase.functions.invoke('bulk-generate-single-aspect', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Bulk generation failed');
      }

      const response: BulkSingleAspectResponse = data;

      // Show appropriate toast messages
      if (response.message) {
        toast.info(response.message);
      } else if (response.imagesGenerated > 0) {
        toast.success(
          `Generated ${response.imagesGenerated}/${response.postsProcessed} images (${aspectRatio}) in ${Math.round(response.processingTimeMs / 1000)}s`,
          {
            description: `Cost: $${response.totalCost.toFixed(4)} | Tokens: ${response.totalTokens.toLocaleString()}`
          }
        );
      }

      // Show warnings for failures
      if (response.failures.length > 0) {
        toast.warning(`${response.failures.length} images failed to generate`);
      }

      console.log(`✅ [BULK_SINGLE] Completed ${aspectRatio} generation:`, {
        generated: response.imagesGenerated,
        failed: response.failures.length,
        cost: response.totalCost,
        time: response.processingTimeMs
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Bulk generation failed', {
        description: errorMessage
      });
      
      console.error(`❌ [BULK_SINGLE] Error:`, error);
      
      // Return error response
      return {
        success: false,
        results: [],
        failures: [],
        totalCost: 0,
        totalTokens: 0,
        imagesGenerated: 0,
        processingTimeMs: 0,
        aspectRatio,
        mode,
        postsProcessed: postIds.length
      };
    } finally {
      // Clear processing state for all posts
      postIds.forEach(id => setProcessing(id, 'generate', false));
      setIsProcessing(false);
    }
  }, [setProcessing, isProcessing]);

  return {
    generateBulkSingleAspect,
    isProcessing
  };
};