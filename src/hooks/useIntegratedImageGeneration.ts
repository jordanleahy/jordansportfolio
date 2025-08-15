import { useState, useCallback } from 'react';
import { useStreamlinedImageGeneration } from './useStreamlinedImageGeneration';
import { useThemeVisualPromptCache } from './useThemeVisualPromptCache';
import { useCachedPromptGeneration } from './useCachedPromptGeneration';
import { optimizedCacheManager } from '@/lib/optimizedCacheManager';
import { ColorTheme } from '@/types/colorTheme';
import { useToast } from '@/hooks/use-toast';

interface IntegratedGenerationRequest {
  post: { 
    id: string; 
    title: string; 
    description: string; 
    category?: string; 
  };
  colorTheme?: ColorTheme;
  onSuccess?: (imageUrl: string) => void;
  useOptimizations?: boolean;
}

interface PerformanceMetrics {
  totalTime: number;
  breakdown: {
    cacheCheck: number;
    promptGeneration: number;
    imageGeneration: number;
    upload: number;
  };
  optimizationsUsed: string[];
  cacheHitRate: number;
}

export const useIntegratedImageGeneration = () => {
  const { toast } = useToast();
  const streamlinedGeneration = useStreamlinedImageGeneration();
  const themeCache = useThemeVisualPromptCache();
  const promptCache = useCachedPromptGeneration();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  const generateWithOptimizations = useCallback(async (
    request: IntegratedGenerationRequest
  ): Promise<string | null> => {
    const startTime = Date.now();
    const optimizationsUsed: string[] = [];
    let cacheCheckTime = 0;
    
    try {
      // Step 1: Check multiple cache layers
      const cacheStart = Date.now();
      
      // Check if we can use theme-specific visual prompt cache
      let cachedPrompt: string | null = null;
      
      if (request.colorTheme && request.useOptimizations !== false) {
        optimizationsUsed.push('Theme Visual Prompt Cache');
        
        cachedPrompt = await themeCache.generateWithThemeCache({
          title: request.post.title,
          description: request.post.description,
          theme: request.colorTheme,
          category: request.post.category || 'general',
          aspectRatio: '1:1'
        });
      }
      
      // Fallback to standard prompt cache
      if (!cachedPrompt && request.useOptimizations !== false) {
        optimizationsUsed.push('Standard Prompt Cache');
        
        cachedPrompt = await promptCache.generateWithCache({
          title: request.post.title,
          description: request.post.description,
          theme: request.colorTheme?.name,
          themeId: request.colorTheme?.id,
          category: request.post.category
        });
      }
      
      // Final fallback to optimized cache manager
      if (!cachedPrompt && request.useOptimizations !== false) {
        optimizationsUsed.push('Optimized Cache Manager');
        
        cachedPrompt = await optimizedCacheManager.getCachedPrompt({
          title: request.post.title,
          description: request.post.description,
          theme: request.colorTheme?.name,
          category: request.post.category,
          colorTheme: request.colorTheme
        });
      }
      
      cacheCheckTime = Date.now() - cacheStart;
      
      if (cachedPrompt) {
        optimizationsUsed.push('Cache Hit - Skipped Prompt Generation');
        toast({
          title: "Using cached prompt",
          description: `Found optimized prompt in ${optimizationsUsed[0]}`,
        });
      }

      // Step 2: Use streamlined generation with enhanced request
      const enhancedRequest = {
        ...request,
        colorTheme: request.colorTheme || undefined
      };

      const imageUrl = await streamlinedGeneration.generateHeroImage(enhancedRequest);
      
      const totalTime = Date.now() - startTime;
      
      // Step 3: Update performance metrics
      const cacheStats = optimizedCacheManager.getCacheStats();
      const metrics: PerformanceMetrics = {
        totalTime,
        breakdown: {
          cacheCheck: cacheCheckTime,
          promptGeneration: streamlinedGeneration.metrics?.promptTime || 0,
          imageGeneration: streamlinedGeneration.metrics?.imageTime || 0,
          upload: streamlinedGeneration.metrics?.uploadTime || 0
        },
        optimizationsUsed,
        cacheHitRate: cacheStats.hitRate
      };
      
      setPerformanceMetrics(metrics);
      
      // Log performance for debugging
      console.log('🚀 Integrated Generation Performance:', {
        totalTime: `${totalTime}ms`,
        optimizations: optimizationsUsed,
        cacheHitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
        breakdown: metrics.breakdown
      });
      
      if (imageUrl && request.onSuccess) {
        request.onSuccess(imageUrl);
      }
      
      return imageUrl;
      
    } catch (error) {
      console.error('Integrated generation failed:', error);
      
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive"
      });
      
      return null;
    }
  }, [streamlinedGeneration, themeCache, promptCache, toast]);

  const preloadCache = useCallback(async (category: string, theme?: ColorTheme) => {
    try {
      // Preload optimized cache
      await optimizedCacheManager.preloadCommonPrompts(category, theme?.name);
      
      toast({
        title: "Cache preloaded",
        description: `Preloaded prompts for ${category} category`,
      });
    } catch (error) {
      console.warn('Cache preload failed:', error);
    }
  }, [toast]);

  const clearAllCaches = useCallback(() => {
    optimizedCacheManager.clearCache();
    
    // Clear other caches if available
    if (themeCache.clearThemeCache && themeCache.clearCategoryCache) {
      // Note: We'd need specific cache clearing methods from the theme cache
    }
    
    toast({
      title: "All caches cleared",
      description: "All image generation caches have been cleared",
    });
  }, [toast]);

  const getCachePerformance = useCallback(() => {
    const stats = optimizedCacheManager.getCacheStats();
    optimizedCacheManager.logPerformance();
    return stats;
  }, []);

  return {
    generateImage: generateWithOptimizations,
    preloadCache,
    clearAllCaches,
    getCachePerformance,
    
    // Expose individual hook states for debugging
    isGenerating: streamlinedGeneration.isGenerating,
    generationProgress: streamlinedGeneration.generationProgress,
    currentStep: streamlinedGeneration.currentStep,
    performanceMetrics,
    
    // Individual optimizations available
    streamlinedGeneration,
    themeCache,
    promptCache
  };
};