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

export const useSystemPromptCache = (theme: string, category?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['system-prompt-cached', theme, category],
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
              const fresh = await fetchFreshPrompt(theme, user.id, category);
              if (fresh && fresh.version > cached.version) {
                await systemPromptCache.set(cacheKey, user.id, fresh);
                queryClient.setQueryData(['system-prompt-cached', theme, category], fresh);
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
        const fresh = await fetchFreshPrompt(theme, user.id, category);
        
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
async function fetchFreshPrompt(theme: string, userId: string, category?: string): Promise<SystemPromptData | null> {
  const { data, error } = await supabase
    .from('system_prompts')
    .select('prompt_text, agent_name, updated_at, version, theme, theme_description')
    .eq('user_id', userId)
    .eq('theme', theme)
    .eq('category', category || 'general')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found for theme, try fallback to category-only
      if (category) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('system_prompts')
          .select('prompt_text, agent_name, updated_at, version, theme, theme_description')
          .eq('user_id', userId)
          .eq('category', category)
          .is('theme', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fallbackError || !fallbackData) return null;
        
        return {
          prompt: fallbackData.prompt_text,
          agentName: fallbackData.agent_name,
          lastUpdated: fallbackData.updated_at,
          version: fallbackData.version,
          theme: fallbackData.theme,
          themeDescription: fallbackData.theme_description
        };
      }
      return null;
    }
    throw error;
  }

  return {
    prompt: data.prompt_text,
    agentName: data.agent_name,
    lastUpdated: data.updated_at,
    version: data.version,
    theme: data.theme,
    themeDescription: data.theme_description
  };
}