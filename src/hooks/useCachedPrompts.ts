
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CachedPrompt {
  id: string;
  cache_key: string;
  prompt_text: string;
  category: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useCachedPrompts = (category?: string) => {
  return useQuery({
    queryKey: ['cached-prompts', category],
    queryFn: async () => {
      let query = supabase
        .from('cached_prompts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CachedPrompt[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCachedPromptsStats = () => {
  return useQuery({
    queryKey: ['cached-prompts-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cached_prompts')
        .select('category')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      const stats = data.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {});
      
      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteCachedPrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cached_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });
      toast({
        title: "Success",
        description: "Cached prompt deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete cached prompt",
        variant: "destructive",
      });
    },
  });
};

export const useBulkDeleteCachedPrompts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('cached_prompts')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['cached-prompts-stats'] });
      toast({
        title: "Success",
        description: `${ids.length} cached prompts deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete cached prompts",
        variant: "destructive",
      });
    },
  });
};

export const useClearAllCachedPrompts = (category?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      let query = supabase
        .from('cached_prompts')
        .delete()
        .eq('user_id', currentUser.data.user.id);
      
      if (category) {
        query = query.eq('category', category);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['cached-prompts-stats'] });
      toast({
        title: "Success",
        description: category 
          ? `All ${category} cached prompts cleared successfully`
          : "All cached prompts cleared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear cached prompts",
        variant: "destructive",
      });
    },
  });
};
