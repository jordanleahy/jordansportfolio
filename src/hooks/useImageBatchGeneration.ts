import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeText } from '@/utils/textSanitization';
import { useProcessingStates } from './useProcessingStates';
import type { 
  BulkImageGenerationRequest, 
  BulkImageGenerationResponse, 
  OptimizedBulkGenerationHook, 
  AspectRatio 
} from '@/types/bulkImageGeneration';

// Helper function to create a cache key for prompt caching
const createPromptCacheKey = (request: BulkImageGenerationRequest): string => {
  const { title, description, category = 'general' } = request;
  
  // Sanitize text inputs to prevent Unicode encoding issues
  const sanitizedTitle = sanitizeText(title || '');
  const sanitizedDescription = sanitizeText(description || '');
  const sanitizedCategory = sanitizeText(category);
  
  // Create a stable hash from the sanitized content for consistent caching
  const content = `${sanitizedTitle}|${sanitizedDescription}|${sanitizedCategory}`.toLowerCase().trim();
  
  try {
    return `prompt_${sanitizedCategory}_${btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
  } catch (error) {
    console.warn('Failed to encode cache key, using fallback:', error);
    // Fallback: use a simple hash-like string
    return `prompt_${sanitizedCategory}_${content.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
  }
};

// Helper function to cache a generated prompt
const cacheGeneratedPrompt = async (
  cacheKey: string, 
  prompt: string, 
  category: string,
  metadata: any = {}
) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Check if prompt already exists
    const { data: existing } = await supabase
      .from('cached_prompts')
      .select('id')
      .eq('cache_key', cacheKey)
      .eq('user_id', user.user.id)
      .single();

    if (existing) {
      // Update existing cache entry
      await supabase
        .from('cached_prompts')
        .update({
          prompt_text: prompt,
          metadata,
          updated_at: new Date().toISOString(),
          version: 1 // Increment version for cache invalidation
        })
        .eq('id', existing.id);
    } else {
      // Create new cache entry
      await supabase
        .from('cached_prompts')
        .insert({
          cache_key: cacheKey,
          prompt_text: prompt,
          category,
          metadata,
          user_id: user.user.id,
          version: 1,
          hit_count: 0
        });
    }
  } catch (error) {
    // Don't throw - caching failures shouldn't break generation
  }
};

// Helper function to retrieve cached prompt
const getCachedPrompt = async (cacheKey: string): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: cached } = await supabase
      .from('cached_prompts')
      .select('prompt_text, id')
      .eq('cache_key', cacheKey)
      .eq('user_id', user.user.id)
      .single();

    if (cached) {
      // Update hit count and access time
      await supabase.rpc('update_cache_hit', {
        cache_key_param: cacheKey
      });
      
      return cached.prompt_text;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const useImageBatchGeneration = (): OptimizedBulkGenerationHook => {
  const { setBulkProcessing, isGenerating, clearProcessing } = useProcessingStates();
  const [progress, setProgress] = useState<{ 
    completed: number; 
    total: number; 
    currentAspectRatio?: AspectRatio;
    isProcessing?: boolean;
    isFinalizing?: boolean;
  }>({
    completed: 0,
    total: 4,
    currentAspectRatio: undefined,
    isProcessing: false,
    isFinalizing: false
  });
  const [error, setError] = useState<string | null>(null);
  const [cachedPrompts, setCachedPrompts] = useState<Map<string, string>>(new Map());

  // Function to get or generate prompt with caching
  const getOrGeneratePrompt = useCallback(async (request: BulkImageGenerationRequest): Promise<string> => {
    const cacheKey = createPromptCacheKey(request);
    
    // Check memory cache first
    if (cachedPrompts.has(cacheKey)) {
      return cachedPrompts.get(cacheKey)!;
    }
    
    // Check database cache
    const cachedPrompt = await getCachedPrompt(cacheKey);
    if (cachedPrompt) {
      // Store in memory cache for faster subsequent access
      setCachedPrompts(prev => new Map(prev).set(cacheKey, cachedPrompt));
      return cachedPrompt;
    }
    
    // Generate new prompt
    const { data, error } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
      body: { 
        title: request.title, 
        description: request.description, 
        category: request.category 
      }
    });

    if (error || !data?.generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }

    const newPrompt = data.generatedPrompt;
    
    // Cache the new prompt
    await cacheGeneratedPrompt(cacheKey, newPrompt, request.category || 'general', {
      title: request.title,
      description: request.description,
      generated_at: new Date().toISOString()
    });
    
    // Store in memory cache
    setCachedPrompts(prev => new Map(prev).set(cacheKey, newPrompt));
    
    return newPrompt;
  }, [cachedPrompts]);

  const generateAllImages = useCallback(async (request: BulkImageGenerationRequest): Promise<BulkImageGenerationResponse> => {
    console.log(`🚀 [BatchGeneration] Starting bulk generation for post: ${request.postId}`);
    
    if (isGenerating(request.postId)) {
      console.log(`⚠️ [BatchGeneration] Generation already in progress for post: ${request.postId}`);
      throw new Error('Generation already in progress for this post');
    }

    setBulkProcessing(request.postId, true);
    setError(null);
    
    // Start extended progress simulation with shimmer effects
    const aspectRatios: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4'];
    let currentIndex = 0;
    let isInFinalizing = false;
    
    setProgress({
      completed: 0,
      total: aspectRatios.length,
      currentAspectRatio: aspectRatios[0],
      isProcessing: true,
      isFinalizing: false
    });

    // Extended progress simulation - matches actual generation times (60-90s)
    const progressInterval = setInterval(() => {
      if (currentIndex < aspectRatios.length - 1) {
        currentIndex++;
        setProgress(prev => ({
          ...prev,
          completed: currentIndex,
          currentAspectRatio: aspectRatios[currentIndex],
          isProcessing: true,
          isFinalizing: false
        }));
      } else if (!isInFinalizing) {
        // After simulation completes, enter finalizing state with continuous shimmer
        isInFinalizing = true;
        setProgress(prev => ({
          ...prev,
          completed: aspectRatios.length,
          currentAspectRatio: undefined,
          isProcessing: false,
          isFinalizing: true
        }));
      }
    }, 15000); // Update every 15 seconds for more realistic timing

    try {
      // Get or generate cached prompt first
      const cachedPrompt = await getOrGeneratePrompt(request);
      
      // Use optimized edge function with enhanced request including cached prompt
      const enhancedRequest = {
        ...request,
        cachedPrompt, // Pass the cached prompt to the edge function
        useCachedPrompt: true
      };
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-all-images-optimized', {
        body: enhancedRequest
      });

      clearInterval(progressInterval);

      if (functionError) {
        throw new Error(functionError.message || 'Batch generation failed');
      }

      if (!data.success) {
        throw new Error('Batch generation returned failure status');
      }

      const response: BulkImageGenerationResponse = data;
      
      // Complete the progress
      setProgress({
        completed: aspectRatios.length,
        total: aspectRatios.length,
        currentAspectRatio: undefined,
        isProcessing: false,
        isFinalizing: false
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
      setBulkProcessing(request.postId, false);
      console.log(`✅ [BatchGeneration] Completed bulk generation for post: ${request.postId}`);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress({ 
          completed: 0, 
          total: 4, 
          currentAspectRatio: undefined,
          isProcessing: false,
          isFinalizing: false
        });
      }, 1000);
    }
  }, [cachedPrompts]);

  return {
    generateAllImages,
    isGenerating,
    progress,
    error,
    getOrGeneratePrompt, // Expose this function for single image generation
    clearCache: () => setCachedPrompts(new Map()) // Function to clear memory cache
  };
};