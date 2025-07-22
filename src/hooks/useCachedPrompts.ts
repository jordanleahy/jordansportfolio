
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

export const useCachedPrompts = () => {
  return useQuery({
    queryKey: ['cached-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cached_prompts')
        .select('*')
        .eq('category', 'blog_visual')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as CachedPrompt[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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

export const useClearAllCachedPrompts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cached_prompts')
        .delete()
        .eq('user_id', currentUser.data.user.id)
        .eq('category', 'blog_visual');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });
      toast({
        title: "Success",
        description: "All cached prompts cleared successfully",
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
