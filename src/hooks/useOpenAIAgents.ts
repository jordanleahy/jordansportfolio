import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIAgent, CreateAgentData, UpdateAgentData } from '@/types/openaiAgent';
import { useEntityActionsWrapper } from './useEntityActionsWrapper';

export const useOpenAIAgents = () => {
  return useQuery({
    queryKey: ['openai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OpenAIAgent[];
    },
  });
};

export const useOpenAIAgent = (id: string) => {
  return useQuery({
    queryKey: ['openai-agent', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OpenAIAgent;
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