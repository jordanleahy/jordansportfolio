import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentModelOption {
  id: string;
  model_value: string;
  model_label: string;
  description?: string;
  is_recommended: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all active model options
export const useAgentModelOptions = () => {
  return useQuery({
    queryKey: ['agent-model-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_model_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as AgentModelOption[];
    },
  });
};

// Get model options formatted for form selects
export const useModelOptionsForForm = () => {
  const { data: modelOptions, ...rest } = useAgentModelOptions();
  
  const formattedOptions = modelOptions?.map(option => ({
    value: option.model_value,
    label: option.model_label,
    description: option.description,
    recommended: option.is_recommended,
  })) || [];

  return {
    data: formattedOptions,
    ...rest,
  };
};