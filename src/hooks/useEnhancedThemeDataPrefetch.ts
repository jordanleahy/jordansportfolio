import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { cacheManager } from '@/lib/cacheManager';

interface EnhancedThemeData {
  themeId: string;
  theme: string;
  category: string;
  systemPromptId?: string;
  systemPrompt?: any;
}

export const useEnhancedThemeDataPrefetch = () => {
  const params = useParams();
  const [themeData, setThemeData] = useState<EnhancedThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefetchThemeData = useCallback(async () => {
    const theme = params.theme ? decodeURIComponent(params.theme) : '';
    const category = params.category || 'cdi';
    
    if (!theme) {
      setThemeData({ themeId: '', theme: '', category });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use cache manager for theme data
      const cachedTheme = await cacheManager.getThemeData(theme, category);
      
      let systemPrompt = null;
      if (cachedTheme?.id) {
        // Prefetch system prompt if we have theme ID
        systemPrompt = await cacheManager.getSystemPrompt(cachedTheme.id, category);
      }

      const result: EnhancedThemeData = {
        themeId: cachedTheme?.id || '',
        theme,
        category,
        systemPromptId: cachedTheme?.system_prompt_id,
        systemPrompt
      };

      setThemeData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch theme data';
      setError(errorMessage);
      console.error('Error in enhanced theme prefetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.theme, params.category]);

  useEffect(() => {
    prefetchThemeData();
  }, [prefetchThemeData]);

  const getThemeData = useCallback(() => {
    return themeData;
  }, [themeData]);

  const refreshThemeData = useCallback(() => {
    return prefetchThemeData();
  }, [prefetchThemeData]);

  return {
    themeData,
    isLoading,
    error,
    getThemeData,
    refreshThemeData
  };
};