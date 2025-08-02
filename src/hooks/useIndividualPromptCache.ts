import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface IndividualPromptData {
  prompt: string;
  lastUpdated: string;
  version: number;
}

export const useIndividualPromptCache = (postId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['individual-prompt', postId],
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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

      // Optimistic update
      const optimisticData: IndividualPromptData = {
        prompt: newPrompt,
        lastUpdated: new Date().toISOString(),
        version: (query.data?.version || 0) + 1
      };
      
      queryClient.setQueryData(['individual-prompt', postId], optimisticData);

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
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['individual-prompt', postId] });
      
      toast({
        title: "Success",
        description: "Individual prompt updated successfully",
      });
    },
    onError: (error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['individual-prompt', postId] });
      
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

      const { data, error } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: { 
          title, 
          description, 
          category: category || 'cdi',
          aspect_ratio: aspectRatio || '16:9'
        }
      });

      if (error) throw error;
      
      // Update the post with the new prompt
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ 
          generated_image_prompt: data.prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['individual-prompt', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast({
        title: "Success",
        description: "Individual prompt regenerated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate individual prompt",
        variant: "destructive",
      });
      console.error('Regenerate error:', error);
    },
  });

  const invalidateCache = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['individual-prompt', postId] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
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