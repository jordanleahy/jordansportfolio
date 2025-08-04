import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIAgent, CreateAgentData, UpdateAgentData } from '@/types/openaiAgent';
import { useEntityActionsWrapper } from './useEntityActionsWrapper';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to transform database agent data to OpenAIAgent type
const transformAgentData = (agent: any): OpenAIAgent => ({
  ...agent,
  metrics: agent.metrics && typeof agent.metrics === 'object' && !Array.isArray(agent.metrics) 
    ? agent.metrics as { latencyMs: number; errorRate: number; }
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
  const { user } = useAuth();

  // Set up realtime subscription via unified realtime
  useUnifiedRealtime({
    enabled: !!user?.id,
    userId: user?.id,
    onAgentUpdate: () => {
      console.log('Realtime update for agents via unified realtime');
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
    }
  });

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
  const { user } = useAuth();

  // Set up realtime subscription for specific agent via unified realtime
  useUnifiedRealtime({
    enabled: !!user?.id && !!id,
    userId: user?.id,
    onAgentUpdate: () => {
      console.log('Realtime update for specific agent via unified realtime');
      queryClient.invalidateQueries({ queryKey: ['openai-agent', id] });
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
    }
  });

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