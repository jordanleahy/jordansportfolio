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

export const useSystemPromptCache = (themeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['system-prompt-cached', themeId],
    queryFn: async (): Promise<SystemPromptData | null> => {
      console.log('🔍 [useSystemPromptCache] Query function called with themeId:', themeId);
      if (!themeId) {
        console.log('❌ [useSystemPromptCache] No themeId provided, returning null');
        return null;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Try cache first using themeId
        const cached = await systemPromptCache.get(themeId, user.id);
        if (cached) {
          console.log(`⚡ [useSystemPromptCache] Cache hit for themeId: ${themeId}`);
          
          // Background update - don't await this
          setTimeout(async () => {
            try {
              const fresh = await fetchFreshPrompt(themeId, user.id);
              if (fresh && fresh.version > cached.version) {
                await systemPromptCache.set(themeId, user.id, fresh);
                queryClient.setQueryData(['system-prompt-cached', themeId], fresh);
                console.log(`🔄 [useSystemPromptCache] Background update for themeId: ${themeId}`);
              }
            } catch (error) {
              console.warn('Background update failed:', error);
            }
          }, 100);

          return cached;
        }

        // Cache miss - fetch fresh data
        console.log(`💾 [useSystemPromptCache] Cache miss for themeId: ${themeId}, fetching fresh data`);
        const fresh = await fetchFreshPrompt(themeId, user.id);
        
        if (fresh) {
          await systemPromptCache.set(themeId, user.id, fresh);
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
        
        queryClient.setQueryData(['system-prompt-cached', themeId], optimisticData);
        await systemPromptCache.set(themeId!, user.id, optimisticData);
      }

      // Update in theme_system_prompts table using theme_id
      const { error: updateError } = await supabase
        .from('theme_system_prompts')
        .update({ 
          prompt_text: newPrompt,
          updated_at: new Date().toISOString(),
          version: (currentData?.version || 0) + 1
        })
        .eq('user_id', user.id)
        .eq('theme_id', themeId);

      if (updateError) throw updateError;

      return { newPrompt, userId: user.id };
    },
    onSuccess: async ({ newPrompt, userId }) => {
      // Clear cached prompts for this theme when system prompt is updated
      try {
        await supabase
          .from('cached_prompts')
          .delete()
          .eq('user_id', userId);
        
        // Invalidate cached prompts queries
        queryClient.invalidateQueries({ queryKey: ['cached-prompts', themeId] });
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
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', themeId] });
      
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

      // Get theme data from themeId to get the necessary information
      let themeData = null;
      if (themeId) {
        const { data } = await supabase
          .from('themes')
          .select('theme_name, category')
          .eq('id', themeId)
          .single();
        themeData = data;
      }

      if (!themeData) {
        throw new Error('Theme not found');
      }

      const { data, error } = await supabase.functions.invoke('create-theme-system-prompt', {
        body: { 
          theme: themeData.theme_name, 
          category: themeData.category, 
          theme_id: themeId,
          user_id: user.id 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate cache and refetch
      const { data: { user } } = await supabase.auth.getUser();
      if (user && themeId) {
        await systemPromptCache.invalidate(themeId, user.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', themeId] });
      
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
    if (user && themeId) {
      await systemPromptCache.invalidate(themeId, user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', themeId] });
  }, [themeId, queryClient]);

  const prefetchPrompt = useCallback(async () => {
    if (!query.data) {
      queryClient.prefetchQuery({
        queryKey: ['system-prompt-cached', themeId],
        queryFn: () => query.refetch()
      });
    }
  }, [themeId, query, queryClient]);

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

// Helper function to fetch fresh prompt data from system_prompts table using theme_id
async function fetchFreshPrompt(themeId: string, userId: string): Promise<SystemPromptData | null> {
  try {
    console.log(`🎯 [fetchFreshPrompt] Using themeId: ${themeId}`);
    
    const { data: promptData, error: promptError } = await supabase
      .from('theme_system_prompts')
      .select('prompt_text, agent_name, updated_at, version, theme, theme_description, theme_id')
      .eq('theme_id', themeId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any;

    if (promptError && promptError.code !== 'PGRST116') {
      throw promptError;
    }

    if (!promptData) {
      console.log(`📋 [fetchFreshPrompt] No prompt found for themeId: ${themeId}`);
      return null;
    }

    console.log(`📋 [fetchFreshPrompt] Found prompt for themeId: ${themeId}`);

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