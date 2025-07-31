import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  BatchGenerationRequest, 
  BatchGenerationResponse, 
  AspectRatio,
  OptimizedBatchGenerationHook 
} from '@/types/batchImageGeneration';

export const useOptimizedBatchGeneration = (): OptimizedBatchGenerationHook => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 4 });
  const [error, setError] = useState<string | null>(null);

  const generateAllImages = useCallback(async (request: BatchGenerationRequest): Promise<BatchGenerationResponse> => {
    setIsGenerating(true);
    setError(null);
    setProgress({ completed: 0, total: 4 });

    try {
      console.log('🎨 Starting optimized batch generation for post:', request.postId);
      
      // Use optimized edge function
      const { data, error: functionError } = await supabase.functions.invoke('generate-all-images-optimized', {
        body: request
      });

      if (functionError) {
        throw new Error(functionError.message || 'Batch generation failed');
      }

      if (!data.success) {
        throw new Error('Batch generation returned failure status');
      }

      const response: BatchGenerationResponse = data;
      
      // Show success message with details
      if (response.imagesGenerated > 0) {
        toast.success(
          `Generated ${response.imagesGenerated}/${response.aspectRatiosProcessed} images in ${Math.round(response.processingTimeMs / 1000)}s`,
          {
            description: `Cost: $${response.totalCost.toFixed(4)} | Tokens: ${response.totalTokens.toLocaleString()}`
          }
        );
      }

      // Show warnings for any failures
      if (response.failures.length > 0) {
        const failedAspectRatios = response.failures.map(f => f.aspectRatio).join(', ');
        toast.warning(`Some images failed to generate: ${failedAspectRatios}`);
      }

      setProgress({ completed: response.imagesGenerated, total: response.aspectRatiosProcessed });
      
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Optimized batch generation error:', error);
      setError(errorMessage);
      toast.error('Batch generation failed', {
        description: errorMessage
      });
      
      // Return error response
      return {
        success: false,
        results: [],
        failures: [],
        totalCost: 0,
        totalTokens: 0,
        imagesGenerated: 0,
        processingTimeMs: 0,
        aspectRatiosProcessed: 4
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateAllImages,
    isGenerating,
    progress,
    error
  };
};