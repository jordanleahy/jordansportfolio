import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIAgent, CreateAgentData, UpdateAgentData } from '@/types/openaiAgent';
import { useToast } from '@/hooks/use-toast';

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

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('openai_agents')
        .insert([{ ...agentData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as OpenAIAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      toast({
        title: "Agent created",
        description: "Your OpenAI agent has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateAgentData) => {
      const { data, error } = await supabase
        .from('openai_agents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as OpenAIAgent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['openai-agent', data.id] });
      toast({
        title: "Agent updated",
        description: "Your OpenAI agent has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('openai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      toast({
        title: "Agent deleted",
        description: "Your OpenAI agent has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};