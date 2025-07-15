import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent, CreateAgentData, UpdateAgentData } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Agent[];
    },
  });
};

export const useAgent = (slug: string) => {
  return useQuery({
    queryKey: ['agent', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!slug,
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAgentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return agent as Agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agent created',
        description: 'Your agent has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating agent',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgentData }) => {
      const { data: agent, error } = await supabase
        .from('agents')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return agent as Agent;
    },
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agent.slug] });
      toast({
        title: 'Agent updated',
        description: 'Your agent has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating agent',
        description: error.message,
        variant: 'destructive',
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
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agent deleted',
        description: 'Your agent has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting agent',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};