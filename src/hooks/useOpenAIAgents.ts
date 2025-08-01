import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIAgent, CreateAgentData, UpdateAgentData, SystemPrompt } from '@/types/openaiAgent';
import { useEntityActionsWrapper } from './useEntityActionsWrapper';

// Helper function to transform database agent data to OpenAIAgent type
const transformAgentData = (agent: any): OpenAIAgent => ({
  ...agent,
  metrics: agent.metrics && typeof agent.metrics === 'object' && !Array.isArray(agent.metrics) 
    ? agent.metrics as { latencyMs: number; errorRate: number; }
    : undefined,
  system_prompts: Array.isArray(agent.system_prompts) 
    ? agent.system_prompts as SystemPrompt[]
    : undefined,
  tags: Array.isArray(agent.tags) 
    ? agent.tags as string[]
    : undefined,
  supported_categories: Array.isArray(agent.supported_categories) 
    ? agent.supported_categories as string[]
    : undefined
});

export const useOpenAIAgents = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('openai-agents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'openai_agents'
        },
        (payload: any) => {
          console.log('Realtime update for openai_agents:', payload);
          
          // Invalidate and refetch the agents list
          queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
          
          // If we have the agent ID, also invalidate the specific agent query
          if ((payload.new as any)?.id || (payload.old as any)?.id) {
            const agentId = (payload.new as any)?.id || (payload.old as any)?.id;
            queryClient.invalidateQueries({ queryKey: ['openai-agent', agentId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['openai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match OpenAIAgent type
      return data.map(transformAgentData);
    },
  });
};

export const useOpenAIAgent = (id: string) => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for specific agent
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`openai-agent-${id}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'openai_agents',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Realtime update for specific agent:', payload);
          
          // Invalidate specific agent query
          queryClient.invalidateQueries({ queryKey: ['openai-agent', id] });
          
          // Also invalidate the agents list
          queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return useQuery({
    queryKey: ['openai-agent', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to match OpenAIAgent type
      return transformAgentData(data);
    },
    enabled: !!id,
  });
};

const useAgentActions = () => useEntityActionsWrapper<OpenAIAgent, CreateAgentData>({
  tableName: 'openai_agents',
  queryKey: ['openai-agents'],
  entityName: 'Agent',
  onSuccessMessage: {
    create: 'Your OpenAI agent has been created successfully.',
    update: 'Your OpenAI agent has been updated successfully.',
    delete: 'Your OpenAI agent has been deleted successfully.',
  },
  invalidateQueries: (agent) => [
    ['openai-agents'],
    ...(agent ? [['openai-agent', agent.id]] : []),
  ],
});

export const useCreateAgent = () => useAgentActions().create;
export const useUpdateAgent = () => useAgentActions().update;
export const useDeleteAgent = () => useAgentActions().delete;