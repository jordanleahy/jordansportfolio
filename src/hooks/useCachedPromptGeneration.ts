import { useState, useCallback } from 'react';
import { cacheManager } from '@/lib/cacheManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CachedPromptGenerationConfig {
  postId?: string;
  title?: string;
  description?: string;
  theme?: string;
  themeId?: string;
  category?: string;
  aspectRatio?: string;
}

export const useCachedPromptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  const generateWithCache = useCallback(async (config: CachedPromptGenerationConfig): Promise<string | null> => {
    setIsGenerating(true);
    setFromCache(false);

    try {
      console.log('🚀 [PROMPT_CACHE] Starting generation with config:', {
        postId: config.postId,
        themeId: config.themeId,
        title: config.title?.substring(0, 50),
        theme: config.theme,
        category: config.category,
        aspectRatio: config.aspectRatio,
        timestamp: new Date().toISOString()
      });

      // First check cache
      const cachedPrompt = await cacheManager.getCachedPrompt(config);
      
      if (cachedPrompt) {
        console.log('💾 [PROMPT_CACHE] Cache HIT - using cached prompt');
        setFromCache(true);
        toast({
          title: "Prompt Retrieved",
          description: "Using cached prompt for faster response.",
        });
        return cachedPrompt;
      }

      console.log('💥 [PROMPT_CACHE] Cache MISS - generating new prompt');
      console.log('🔄 Generating new prompt...');
      
      console.log('📡 [EDGE_FUNCTION] Calling visual-prompt-generator with:', {
        postId: config.postId,
        themeId: config.themeId,
        aspectRatio: config.aspectRatio || '1:1'
      });

      const response = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: config.postId,
          themeId: config.themeId,
          aspectRatio: config.aspectRatio || '1:1'
        }
      });

      console.log('📡 [EDGE_FUNCTION] Raw response:', {
        data: response.data,
        error: response.error
      });

      if (response.error) {
        console.error('❌ [EDGE_FUNCTION] Error response:', response.error);
        throw new Error(response.error.message || 'Failed to generate prompt');
      }

      const generatedPrompt = response.data?.generatedPrompt || response.data?.generatedText || '';
      
      console.log('📝 [EDGE_FUNCTION] Extracted prompt:', {
        promptLength: generatedPrompt?.length || 0,
        promptPreview: generatedPrompt?.substring(0, 100),
        fullResponseData: response.data
      });
      
      if (!generatedPrompt) {
        console.error('❌ [EDGE_FUNCTION] No prompt in response data:', response.data);
        throw new Error('No prompt received from the service');
      }

      // Cache the generated prompt
      console.log('💾 [PROMPT_CACHE] Caching generated prompt');
      await cacheManager.setCachedPrompt(config, generatedPrompt);
      
      console.log('✅ [PROMPT_CACHE] Successfully generated and cached prompt');
      toast({
        title: "Prompt Generated",
        description: "New prompt generated and cached for future use.",
      });

      return generatedPrompt;

    } catch (error) {
      console.error('❌ [PROMPT_CACHE] ERROR in cached prompt generation:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        config: config,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const clearCache = useCallback((config: CachedPromptGenerationConfig) => {
    cacheManager.clearPromptCache(config);
    toast({
      title: "Cache Cleared",
      description: "Prompt cache cleared for this configuration.",
    });
  }, [toast]);

  const getCacheStats = useCallback(() => {
    return cacheManager.getCacheStats();
  }, []);

  return {
    generateWithCache,
    clearCache,
    getCacheStats,
    isGenerating,
    fromCache
  };
};