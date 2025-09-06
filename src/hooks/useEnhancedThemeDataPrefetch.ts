import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

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
    const category = params.category || 'general';
    
    // ✅ GOOD: Only supporting themeId routes now
    if (!themeId) {
      setThemeData({ themeId: '', theme: '', category });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✅ GOOD: Direct themeId lookup only
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single();
        
      if (error) throw error;
      
      // No system prompt caching needed - removed cache dependency

      const result: EnhancedThemeData = {
        themeId,
        theme: data?.theme_name || '',
        category,
        systemPromptId: data?.visual_prompt_system_prompt_id,
        systemPrompt: null
      };

      setThemeData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch theme data';
      setError(errorMessage);
      console.error('Error in enhanced theme prefetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.themeId, params.category]);

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