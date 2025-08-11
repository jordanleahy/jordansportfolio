import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { systemPromptCache } from '@/services/SystemPromptCache';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface SystemPromptData {
  prompt: string;
  agentName: string;
  lastUpdated: string;
  version: number;
  theme?: string;
  themeDescription?: string;
}

export const useSystemPromptCache = (theme: string, category?: string, themeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['system-prompt-cached', theme, category, themeId],
    queryFn: async (): Promise<SystemPromptData | null> => {
      if (!theme) return null;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Try cache first with normalized theme-based key
        const normalizedTheme = theme.toLowerCase().replace(/\s+/g, '-');
        const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '-');
        const cacheKey = `${normalizedTheme}${normalizedCategory ? `-${normalizedCategory}` : ''}`;
        const cached = await systemPromptCache.get(cacheKey, user.id);
        if (cached) {
          console.log(`⚡ [useSystemPromptCache] Cache hit for theme: ${theme}`);
          
          // Background update - don't await this
          setTimeout(async () => {
            try {
              const fresh = await fetchFreshPrompt(theme, user.id, category, themeId);
              if (fresh && fresh.version > cached.version) {
                await systemPromptCache.set(cacheKey, user.id, fresh);
                queryClient.setQueryData(['system-prompt-cached', theme, category, themeId], fresh);
                console.log(`🔄 [useSystemPromptCache] Background update for theme: ${theme}`);
              }
            } catch (error) {
              console.warn('Background update failed:', error);
            }
          }, 100);

          return cached;
        }

        // Cache miss - fetch fresh data
        console.log(`💾 [useSystemPromptCache] Cache miss for theme: ${theme}, fetching fresh data`);
        const fresh = await fetchFreshPrompt(theme, user.id, category, themeId);
        
        if (fresh) {
          await systemPromptCache.set(cacheKey, user.id, fresh);
        }
        
        return fresh;
      } catch (error) {
        console.error('Error in useSystemPromptCache:', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ newPrompt }: { newPrompt: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Optimistic update
      const currentData = query.data;
      if (currentData) {
        const optimisticData: SystemPromptData = {
          prompt: newPrompt,
          agentName: currentData.agentName,
          lastUpdated: new Date().toISOString(),
          version: currentData.version + 1,
          theme: currentData.theme,
          themeDescription: currentData.themeDescription
        };
        
        const cacheKey = `${theme}${category ? `-${category}` : ''}`;
        queryClient.setQueryData(['system-prompt-cached', theme, category], optimisticData);
        await systemPromptCache.set(cacheKey, user.id, optimisticData);
      }

      // Update in new system_prompts table with theme priority
      const { error: updateError } = await supabase
        .from('system_prompts')
        .update({ 
          prompt_text: newPrompt,
          updated_at: new Date().toISOString(),
          version: (currentData?.version || 0) + 1
        })
        .eq('user_id', user.id)
        .eq('theme', theme)
        .eq('category', category || 'general');

      if (updateError) throw updateError;

      return { newPrompt, userId: user.id };
    },
    onSuccess: async ({ newPrompt, userId }) => {
      // Clear cached prompts for this theme when system prompt is updated
      try {
        await supabase
          .from('cached_prompts')
          .delete()
          .eq('category', category || 'general')
          .eq('user_id', userId);
        
        // Invalidate cached prompts queries
        queryClient.invalidateQueries({ queryKey: ['cached-prompts', theme] });
        queryClient.invalidateQueries({ queryKey: ['cached-prompts-stats'] });
        
        toast({
          title: "Success",
          description: "System prompt updated and cache cleared successfully",
        });
      } catch (error) {
        console.error('Failed to clear cache:', error);
        toast({
          title: "Warning",
          description: "System prompt updated but cache clearing failed",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', theme, category] });
      
      toast({
        title: "Error",
        description: "Failed to update system prompt",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: { theme, category, user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate cache and refetch
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheKey = `${theme}${category ? `-${category}` : ''}`;
        await systemPromptCache.invalidate(cacheKey, user.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', theme, category] });
      
      toast({
        title: "Success",
        description: "System prompt regenerated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate system prompt",
        variant: "destructive",
      });
      console.error('Regenerate error:', error);
    },
  });

  const invalidateCache = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const cacheKey = `${theme}${category ? `-${category}` : ''}`;
      await systemPromptCache.invalidate(cacheKey, user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', theme, category] });
  }, [theme, category, queryClient]);

  const prefetchPrompt = useCallback(async () => {
    if (!query.data) {
      queryClient.prefetchQuery({
        queryKey: ['system-prompt-cached', theme, category],
        queryFn: () => query.refetch()
      });
    }
  }, [theme, category, query, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePrompt: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    regeneratePrompt: regenerateMutation.mutate,
    isRegenerating: regenerateMutation.isPending,
    invalidateCache,
    prefetchPrompt,
    refetch: query.refetch
  };
};

// Helper function to fetch fresh prompt data from new system_prompts table with theme priority
async function fetchFreshPrompt(theme: string, userId: string, category?: string, themeId?: string): Promise<SystemPromptData | null> {
  try {
    let promptData = null;
    let promptError = null;

    // Priority 1: Use provided themeId directly
    if (themeId) {
      console.log(`🎯 [fetchFreshPrompt] Using provided themeId: ${themeId}`);
      const { data: directThemeData, error: directThemeError } = await supabase
        .from('system_prompts')
        .select('prompt_text, agent_name, updated_at, version, theme, theme_description, theme_id')
        .eq('theme_id', themeId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      promptData = directThemeData;
      promptError = directThemeError;
    }

    // Priority 2: Try to find theme record to get theme_id
    if (!promptData) {
      const { data: themeRecord, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('theme_name', theme)
        .eq('category', category || 'general')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (themeError) {
        console.error('Error finding theme record:', themeError);
      }

      // Try to find system prompt using theme_id if theme record exists
      if (themeRecord?.id) {
        const { data: themeIdData, error: themeIdError } = await supabase
          .from('system_prompts')
          .select('prompt_text, agent_name, updated_at, version, theme, theme_description, theme_id')
          .eq('theme_id', themeRecord.id)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        promptData = themeIdData;
        promptError = themeIdError;
      }
    }

    // Priority 3: Fallback to text-based theme search if no theme_id match
    if (!promptData) {
      let query = supabase
        .from('system_prompts')
        .select('prompt_text, agent_name, updated_at, version, theme, theme_description, theme_id')
        .eq('user_id', userId)
        .eq('theme', theme);
      
      // If category is provided, filter by it; otherwise find any theme match
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data: themeTextData, error: themeTextError } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      promptData = themeTextData;
      promptError = themeTextError;
    }

    // If no theme-specific prompt found and category provided, try category fallback
    if (!promptData && category) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('system_prompts')
        .select('prompt_text, agent_name, updated_at, version, theme, theme_description, theme_id')
        .eq('user_id', userId)
        .eq('category', category)
        .is('theme', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      promptData = categoryData;
      promptError = categoryError;
    }

    if (promptError && promptError.code !== 'PGRST116') {
      throw promptError;
    }

    if (!promptData) {
      return null;
    }

    return {
      prompt: promptData.prompt_text,
      agentName: promptData.agent_name,
      lastUpdated: promptData.updated_at,
      version: promptData.version || 1,
      theme: promptData.theme,
      themeDescription: promptData.theme_description
    };
  } catch (error) {
    console.error('Error in fetchFreshPrompt:', error);
    return null;
  }
}