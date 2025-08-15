import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';
import { QUERY_KEYS, QUERY_CONFIG, getAllPostQueryKeys } from '@/constants/queryKeys';
import { useParams } from 'react-router-dom';
import { useThemeCompletionStatus } from '@/hooks/useThemeCompletionStatus';

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
  
  // Check theme completion status to validate system prompt availability
  const { hasSystemPrompt, isCompleted } = useThemeCompletionStatus(themeId);

  const query = useQuery({
    queryKey: QUERY_KEYS.individualPrompt(postId),
    queryFn: async (): Promise<IndividualPromptData | null> => {
      
      
      if (!postId) {
        
        return null;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          
          throw new Error('User not authenticated');
        }

        
        
        // Fetch the current post data to get the generated_image_prompt
        const { data: postData, error: postError } = await supabase
          .from('social_media_posts')
          .select('generated_image_prompt, updated_at')
          .eq('id', postId)
          .eq('user_id', user.id)
          .single();

        if (postError) {
          console.error('🔍 [useIndividualPromptCache] Database error:', postError);
          if (postError.code === 'PGRST116') {
            
            return null; // Post not found
          }
          throw postError;
        }


        if (!postData.generated_image_prompt) {
          
          return null; // No prompt yet
        }

        const result = {
          prompt: postData.generated_image_prompt,
          lastUpdated: postData.updated_at,
          version: 1 // We don't track versions for individual prompts yet
        };


        return result;
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
    refetchOnMount: true, // Enable refetching on mount to load existing prompts
  });

  const updateMutation = useMutation({
    mutationFn: async ({ newPrompt }: { newPrompt: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the social_media_posts table with prompt and mark as completed
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ 
          generated_image_prompt: newPrompt,
          individual_prompt_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return { newPrompt, userId: user.id };
    },
    onSuccess: async (data) => {
      // Use refetchQueries to await completion and ensure fresh data
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.individualPrompt(postId) });
      
      // Also refetch all post queries to keep them in sync
      await Promise.all(
        getAllPostQueryKeys().map(key => 
          queryClient.refetchQueries({ queryKey: key })
        )
      );
      
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
    mutationFn: async ({ aspectRatio }: { 
      aspectRatio?: string;
    } = {}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🔄 Regeneration mutation called with:', {
        postId,
        themeId,
        theme,
        aspectRatio,
        hasSystemPrompt
      });

      if (!postId || !themeId) {
        const errorMsg = `Missing required data: postId=${postId}, themeId=${themeId}, theme=${theme}`;
        console.error('❌ Regeneration failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate that system prompt is ready before proceeding
      if (!hasSystemPrompt) {
        const errorMsg = 'Theme system prompt is not ready yet. Please wait for theme completion before generating individual prompts.';
        console.error('❌ System prompt validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Call the visual-prompt-generator function with the new payload format
      const { data, error } = await supabase.functions.invoke('visual-prompt-generator', {
        body: { 
          postId,
          themeId,
          aspectRatio
        }
      });

      if (error) throw error;
      
      // Update the post with the new prompt and mark as completed
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ 
          generated_image_prompt: data.generatedPrompt,
          individual_prompt_status: 'completed',
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
      const isSystemPromptError = error.message?.includes('system prompt is not ready');
      toast({
        title: "Error",
        description: isSystemPromptError ? 
          "Theme system prompt is not ready yet. Please wait for theme completion." : 
          "Failed to generate individual prompt",
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

  const hasPrompt = !!query.data?.prompt;
  

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasPrompt,
    hasSystemPrompt,
    isCompleted,
    updatePrompt: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    regeneratePrompt: regenerateMutation.mutate,
    isRegenerating: regenerateMutation.isPending,
    invalidateCache,
    refetch: query.refetch
  };
};
