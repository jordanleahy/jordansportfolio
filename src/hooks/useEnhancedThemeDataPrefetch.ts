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
    
    console.log('🎨 [THEME_PREFETCH] Starting theme data prefetch:', {
      themeId,
      themeName, 
      category,
      params: params,
      timestamp: new Date().toISOString()
    });
    
    // Handle both new themeId route and legacy theme name route
    if (!themeId && !themeName) {
      console.log('🎨 [THEME_PREFETCH] No theme ID or name provided, using defaults');
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
        console.log('🎨 [THEME_PREFETCH] Fetching theme by ID:', themeId);
        // New URL format: /stories/id/:themeId - fetch theme by ID
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .eq('id', themeId)
          .single();
          
        if (error) {
          console.error('❌ [THEME_PREFETCH] Error fetching theme by ID:', error);
          throw error;
        }
        
        console.log('✅ [THEME_PREFETCH] Theme fetched by ID:', {
          themeId: data?.id,
          themeName: data?.theme_name,
          category: data?.category,
          visualPromptSystemPromptId: data?.visual_prompt_system_prompt_id
        });
        
        cachedTheme = data;
        resolvedThemeName = data?.theme_name || '';
      } else {
        console.log('🎨 [THEME_PREFETCH] Fetching theme by name:', themeName);
        // Legacy URL format: /stories/theme/:themeName - fetch theme by name
        cachedTheme = await cacheManager.getThemeData(themeName);
        resolvedThemeId = cachedTheme?.id || '';
        console.log('✅ [THEME_PREFETCH] Theme fetched by name:', {
          cachedTheme,
          resolvedThemeId
        });
      }
      
      let systemPrompt = null;
      if (resolvedThemeId) {
        console.log('🎨 [THEME_PREFETCH] Fetching system prompt for theme ID:', resolvedThemeId);
        // Prefetch system prompt if we have theme ID
        systemPrompt = await cacheManager.getSystemPrompt(resolvedThemeId);
        console.log('✅ [THEME_PREFETCH] System prompt result:', {
          hasSystemPrompt: !!systemPrompt,
          systemPromptLength: systemPrompt?.length
        });
      }

      const result: EnhancedThemeData = {
        themeId: resolvedThemeId,
        theme: resolvedThemeName,
        category,
        systemPromptId: cachedTheme?.visual_prompt_system_prompt_id,
        systemPrompt
      };

      console.log('🎯 [THEME_PREFETCH] Final theme data result:', {
        themeId: result.themeId,
        theme: result.theme,
        category: result.category,
        hasSystemPromptId: !!result.systemPromptId,
        hasSystemPrompt: !!result.systemPrompt
      });

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