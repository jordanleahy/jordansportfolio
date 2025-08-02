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
}

export const useSystemPromptCache = (category: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['system-prompt-cached', category],
    queryFn: async (): Promise<SystemPromptData | null> => {
      if (!category) return null;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Try cache first
        const cached = await systemPromptCache.get(category, user.id);
        if (cached) {
          console.log(`⚡ [useSystemPromptCache] Cache hit for ${category}`);
          
          // Background update - don't await this
          setTimeout(async () => {
            try {
              const fresh = await fetchFreshPrompt(category, user.id);
              if (fresh && fresh.version > cached.version) {
                await systemPromptCache.set(category, user.id, fresh);
                queryClient.setQueryData(['system-prompt-cached', category], fresh);
                console.log(`🔄 [useSystemPromptCache] Background update for ${category}`);
              }
            } catch (error) {
              console.warn('Background update failed:', error);
            }
          }, 100);

          return cached;
        }

        // Cache miss - fetch fresh data
        console.log(`💾 [useSystemPromptCache] Cache miss for ${category}, fetching fresh data`);
        const fresh = await fetchFreshPrompt(category, user.id);
        
        if (fresh) {
          await systemPromptCache.set(category, user.id, fresh);
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
            version: currentData.version + 1
          };
          
          queryClient.setQueryData(['system-prompt-cached', category], optimisticData);
          await systemPromptCache.set(category, user.id, optimisticData);
        }

      // Update in database
      const { data: agents, error: fetchError } = await supabase
        .from('openai_agents')
        .select('id, system_prompts')
        .eq('user_id', user.id)
        .not('system_prompts', 'is', null);

      if (fetchError) throw fetchError;

      const agent = agents?.find(agent => 
        agent.system_prompts && 
        agent.system_prompts[category]
      );

      if (!agent) throw new Error('Agent not found');

      const updatedPrompts = agent.system_prompts ? {
        ...(agent.system_prompts as Record<string, any>),
        [category]: newPrompt
      } : { [category]: newPrompt };

      const { error: updateError } = await supabase
        .from('openai_agents')
        .update({ 
          system_prompts: updatedPrompts,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (updateError) throw updateError;

      return newPrompt;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "System prompt updated successfully",
      });
    },
    onError: (error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', category] });
      
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
        body: { category, user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate cache and refetch
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await systemPromptCache.invalidate(category, user.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', category] });
      
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
      await systemPromptCache.invalidate(category, user.id);
    }
    queryClient.invalidateQueries({ queryKey: ['system-prompt-cached', category] });
  }, [category, queryClient]);

  const prefetchPrompt = useCallback(async () => {
    if (!query.data) {
      queryClient.prefetchQuery({
        queryKey: ['system-prompt-cached', category],
        queryFn: () => query.refetch()
      });
    }
  }, [category, query, queryClient]);

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

// Helper function to fetch fresh prompt data
async function fetchFreshPrompt(category: string, userId: string): Promise<SystemPromptData | null> {
  const { data, error } = await supabase
    .from('openai_agents')
    .select('name, system_prompts, updated_at')
    .eq('user_id', userId)
    .not('system_prompts', 'is', null);

  if (error) throw error;

  const agent = data?.find(agent => 
    agent.system_prompts && 
    agent.system_prompts[category]
  );

  if (!agent) return null;

  return {
    prompt: agent.system_prompts[category],
    agentName: agent.name,
    lastUpdated: agent.updated_at,
    version: Date.now() // Simple versioning based on timestamp
  };
}