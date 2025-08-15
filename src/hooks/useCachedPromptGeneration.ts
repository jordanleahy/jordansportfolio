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
}

export const useCachedPromptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  const generateWithCache = useCallback(async (config: CachedPromptGenerationConfig): Promise<string | null> => {
    setIsGenerating(true);
    setFromCache(false);

    try {

      // First check cache
      const cachedPrompt = await cacheManager.getCachedPrompt(config);
      
      if (cachedPrompt) {
        
        setFromCache(true);
        toast({
          title: "Prompt Retrieved",
          description: "Using cached prompt for faster response.",
        });
        return cachedPrompt;
      }


      const response = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: config.postId,
          themeId: config.themeId,
          aspectRatio: '1:1' // Base prompt without specific aspect ratio
        }
      });


      if (response.error) {
        console.error('❌ [EDGE_FUNCTION] Error response:', response.error);
        throw new Error(response.error.message || 'Failed to generate prompt');
      }

      const generatedPrompt = response.data?.generatedPrompt || response.data?.generatedText || '';
      
      
      if (!generatedPrompt) {
        console.error('❌ [EDGE_FUNCTION] No prompt in response data:', response.data);
        throw new Error('No prompt received from the service');
      }

      // Cache the generated prompt
      await cacheManager.setCachedPrompt(config, generatedPrompt);
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