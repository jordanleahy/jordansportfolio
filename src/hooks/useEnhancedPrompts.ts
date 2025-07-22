import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedPrompt {
  id: string;
  cache_key: string;
  prompt_text: string;
  category: string;
  prompt_type?: string;
  source_table?: string;
  source_id?: string;
  usage_count?: number;
  last_used_at?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_template?: boolean;
  version?: number;
  parent_prompt_id?: string;
  effectiveness_score?: number;
  metadata?: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptData {
  cache_key: string;
  prompt_text: string;
  category: string;
  prompt_type?: string;
  source_table?: string;
  source_id?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_template?: boolean;
  metadata?: any;
}

export const useEnhancedPrompts = (filters?: {
  category?: string;
  prompt_type?: string;
  is_favorite?: boolean;
  is_template?: boolean;
  tags?: string[];
}) => {
  return useQuery({
    queryKey: ['enhanced-prompts', filters],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('cached_prompts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      
      // Apply client-side filtering for new fields until types are updated
      let filteredData = data || [];
      
      if (filters?.prompt_type) {
        filteredData = filteredData.filter((item: any) => item.prompt_type === filters.prompt_type);
      }
      if (filters?.is_favorite !== undefined) {
        filteredData = filteredData.filter((item: any) => item.is_favorite === filters.is_favorite);
      }
      if (filters?.is_template !== undefined) {
        filteredData = filteredData.filter((item: any) => item.is_template === filters.is_template);
      }
      if (filters?.tags?.length) {
        filteredData = filteredData.filter((item: any) => {
          const itemTags = item.tags || [];
          return filters.tags?.some(tag => itemTags.includes(tag));
        });
      }

      return filteredData as EnhancedPrompt[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promptData: CreatePromptData) => {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cached_prompts')
        .insert([{
          ...promptData,
          user_id: currentUser.data.user.id,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-prompts'] });
      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EnhancedPrompt> }) => {
      const { data, error } = await supabase
        .from('cached_prompts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-prompts'] });
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cached_prompts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-prompts'] });
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    },
  });
};

export const useLogPromptUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usage: {
      prompt_id: string;
      success: boolean;
      execution_time_ms?: number;
      api_cost?: number;
      result_quality_score?: number;
      context_data?: any;
      error_message?: string;
    }) => {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      // Verify prompt exists
      const { error: checkError } = await supabase
        .from('cached_prompts')
        .select('id')
        .eq('id', usage.prompt_id)
        .single();

      if (checkError) throw checkError;

      // Get current usage count
      const { data: currentPrompt } = await supabase
        .from('cached_prompts')
        .select('usage_count')
        .eq('id', usage.prompt_id)
        .single();

      const currentCount = (currentPrompt as any)?.usage_count || 0;

      // Update the prompt's usage statistics
      await supabase
        .from('cached_prompts')
        .update({ 
          usage_count: currentCount + 1,
          last_used_at: new Date().toISOString()
        } as any)
        .eq('id', usage.prompt_id);

      return true;
    },
    onSuccess: () => {
      // Refresh prompts to update usage statistics
      queryClient.invalidateQueries({ queryKey: ['enhanced-prompts'] });
    },
  });
};