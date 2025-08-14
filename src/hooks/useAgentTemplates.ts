import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateAgentData } from '@/types/openaiAgent';

export interface AgentTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  template_data: any; // JSONB field
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all agent templates (system and user's own)
export const useAgentTemplates = () => {
  return useQuery({
    queryKey: ['agent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        template_data: item.template_data as unknown as CreateAgentData
      })) as AgentTemplate[];
    },
  });
};

// Create a new agent template
export const useCreateAgentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Omit<AgentTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agent_templates')
        .insert({
          ...templateData,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
    },
  });
};

// Update an agent template
export const useUpdateAgentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('agent_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
    },
  });
};

// Delete an agent template
export const useDeleteAgentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
    },
  });
};