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
  const [generatingPosts, setGeneratingPosts] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ 
    completed: 0, 
    total: 4,
    currentAspectRatio: undefined as AspectRatio | undefined 
  });
  const [error, setError] = useState<string | null>(null);

  const isGenerating = useCallback((postId: string) => {
    return generatingPosts.has(postId);
  }, [generatingPosts]);

  const generateAllImages = useCallback(async (request: BatchGenerationRequest): Promise<BatchGenerationResponse> => {
    setGeneratingPosts(prev => new Set(prev).add(request.postId));
    setError(null);
    
    // Start progress simulation with shimmer effects
    const aspectRatios: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4'];
    let currentIndex = 0;
    
    setProgress({
      completed: 0,
      total: aspectRatios.length,
      currentAspectRatio: aspectRatios[0]
    });

    // Simulate progress updates during generation
    const progressInterval = setInterval(() => {
      if (currentIndex < aspectRatios.length - 1) {
        currentIndex++;
        setProgress({
          completed: currentIndex,
          total: aspectRatios.length,
          currentAspectRatio: aspectRatios[currentIndex]
        });
      }
    }, 2500); // Update every 2.5 seconds to simulate processing

    try {
      console.log('🎨 Starting optimized batch generation for post:', request.postId);
      
      // Use optimized edge function
      const { data, error: functionError } = await supabase.functions.invoke('generate-all-images-optimized', {
        body: request
      });

      clearInterval(progressInterval);

      if (functionError) {
        throw new Error(functionError.message || 'Batch generation failed');
      }

      if (!data.success) {
        throw new Error('Batch generation returned failure status');
      }

      const response: BatchGenerationResponse = data;
      
      // Complete the progress
      setProgress({
        completed: aspectRatios.length,
        total: aspectRatios.length,
        currentAspectRatio: undefined
      });
      
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
      clearInterval(progressInterval);
      setGeneratingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.postId);
        return newSet;
      });
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress({ completed: 0, total: 4, currentAspectRatio: undefined });
      }, 1000);
    }
  }, []);

  return {
    generateAllImages,
    isGenerating,
    progress,
    error
  };
};