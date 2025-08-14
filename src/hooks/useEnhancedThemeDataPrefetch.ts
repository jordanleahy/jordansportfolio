import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { cacheManager } from '@/lib/cacheManager';
import { supabase } from '@/integrations/supabase/client';

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
    const themeId = params.themeId;
    const themeName = params.theme ? decodeURIComponent(params.theme) : '';
    const category = params.category || 'cdi';
    
    // Handle both new themeId route and legacy theme name route
    if (!themeId && !themeName) {
      setThemeData({ themeId: '', theme: '', category });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let cachedTheme;
      let resolvedThemeId = themeId;
      let resolvedThemeName = themeName;
      
      if (themeId) {
        // New URL format: /stories/id/:themeId - fetch theme by ID
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .eq('id', themeId)
          .single();
          
        if (error) throw error;
        cachedTheme = data;
        resolvedThemeName = data?.theme_name || '';
      } else {
        // Legacy URL format: /stories/theme/:themeName - fetch theme by name
        cachedTheme = await cacheManager.getThemeData(themeName);
        resolvedThemeId = cachedTheme?.id || '';
      }
      
      let systemPrompt = null;
      if (resolvedThemeId) {
        // Prefetch system prompt if we have theme ID
        systemPrompt = await cacheManager.getSystemPrompt(resolvedThemeId);
      }

      const result: EnhancedThemeData = {
        themeId: resolvedThemeId,
        theme: resolvedThemeName,
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
  }, [params.themeId, params.theme, params.category]);

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