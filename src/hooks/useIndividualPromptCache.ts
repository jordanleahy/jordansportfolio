import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';
import { QUERY_KEYS, QUERY_CONFIG, getAllPostQueryKeys } from '@/constants/queryKeys';
import { useParams } from 'react-router-dom';

interface IndividualPromptData {
  prompt: string;
  lastUpdated: string;
  version: number;
}

export const useIndividualPromptCache = (postId: string, themeId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const params = useParams();
  const theme = params.theme ? decodeURIComponent(params.theme) : undefined;

  const query = useQuery({
    queryKey: QUERY_KEYS.individualPrompt(postId),
    queryFn: async (): Promise<IndividualPromptData | null> => {
      if (!postId) return null;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Fetch the current post data to get the generated_image_prompt
        const { data: postData, error: postError } = await supabase
          .from('social_media_posts')
          .select('generated_image_prompt, updated_at')
          .eq('id', postId)
          .eq('user_id', user.id)
          .single();

        if (postError) {
          if (postError.code === 'PGRST116') {
            return null; // Post not found
          }
          throw postError;
        }

        if (!postData.generated_image_prompt) {
          return null; // No prompt yet
        }

        return {
          prompt: postData.generated_image_prompt,
          lastUpdated: postData.updated_at,
          version: 1 // We don't track versions for individual prompts yet
        };
      } catch (error) {
        console.error('Error in useIndividualPromptCache:', error);
        throw error;
      }
    },
    staleTime: QUERY_CONFIG.DEFAULT_STALE_TIME,
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (error.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ newPrompt }: { newPrompt: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the social_media_posts table
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ 
          generated_image_prompt: newPrompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { newPrompt, userId: user.id };
    },
    onSuccess: async () => {
      // Invalidate and refetch the individual prompt query
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.individualPrompt(postId) });
      
      // Also invalidate all post queries to keep them in sync
      getAllPostQueryKeys().forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      toast({
        title: "Success",
        description: "Individual prompt updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update individual prompt",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({ title, description, category, aspectRatio }: { 
      title: string; 
      description: string; 
      category?: string;
      aspectRatio?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the generate-image-prompt-dynamic function
      const { data, error } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: { 
          title, 
          description, 
          themeId,
          category: category || 'gpt-5-launch',
          aspectRatio: aspectRatio || '16:9'
        }
      });

      if (error) throw error;
      
      // Update the post with the new prompt
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ 
          generated_image_prompt: data.generatedPrompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: async () => {
      // Invalidate and refetch the individual prompt query
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.individualPrompt(postId) });
      
      // Also invalidate all post queries to keep them in sync
      getAllPostQueryKeys().forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      toast({
        title: "Success",
        description: "Individual prompt generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate individual prompt",
        variant: "destructive",
      });
      console.error('Regenerate error:', error);
    },
  });

  const invalidateCache = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.individualPrompt(postId) });
    getAllPostQueryKeys().forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [postId, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePrompt: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    regeneratePrompt: regenerateMutation.mutate,
    isRegenerating: regenerateMutation.isPending,
    invalidateCache,
    refetch: query.refetch
  };
};
