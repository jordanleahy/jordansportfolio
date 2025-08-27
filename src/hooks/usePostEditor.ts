import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIndividualPromptCache } from './useIndividualPromptCache';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';

interface EditPostData {
  title: string;
  description: string;
  regeneratePrompt?: boolean;
}

interface UsePostEditorReturn {
  editPost: (postId: string, data: EditPostData) => Promise<void>;
  isEditing: boolean;
  error: string | null;
}

export const usePostEditor = (): UsePostEditorReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: EditPostData }) => {
      const { title, description, regeneratePrompt } = data;
      
      // Validate input
      if (!title.trim()) {
        throw new Error('Title cannot be empty');
      }

      // Step 1: Update post content first
      const updatedPost = await optimizedSocialMediaService.updatePost(postId, {
        title: title.trim(),
        description: description.trim()
      });

      // Step 2: If regenerate prompt is requested, do it after successful content update
      if (regeneratePrompt) {
        try {
          // Get theme info for regeneration
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data: postData, error } = await supabase
            .from('social_media_posts')
            .select('theme_id, category')
            .eq('id', postId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          const { data: promptData, error: promptError } = await supabase.functions.invoke('visual-prompt-generator', {
            body: { 
              postId: postId,
              themeId: postData.theme_id,
              aspectRatio: '1:1'
            }
          });

          if (promptError) throw promptError;
          
          // Update the post with the new prompt
          await supabase
            .from('social_media_posts')
            .update({ 
              generated_image_prompt: promptData.generatedPrompt,
              updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .eq('user_id', user.id);

        } catch (promptError) {
          // Don't throw here - content was already saved successfully
          console.error('Prompt regeneration failed:', promptError);
          toast.warning('Post updated but prompt regeneration failed');
        }
      }

      return updatedPost;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      
      toast.success('Post updated successfully');
    },
    onError: (error: any) => {
      console.error('Post edit error:', error);
      setError(error.message || 'Failed to update post');
      toast.error(error.message || 'Failed to update post');
    }
  });

  const editPost = async (postId: string, data: EditPostData) => {
    setError(null);
    setIsEditing(true);
    
    try {
      await editMutation.mutateAsync({ postId, data });
    } finally {
      setIsEditing(false);
    }
  };

  return {
    editPost,
    isEditing: editMutation.isPending || isEditing,
    error
  };
};