import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseImageGenerationRetryOptions {
  enabled?: boolean;
  userId?: string;
}

/**
 * Hook to handle image generation retry when system prompts become ready.
 * Listens for theme-system-prompt-ready events and triggers image generation.
 */
export const useImageGenerationRetry = ({
  enabled = true,
  userId,
}: UseImageGenerationRetryOptions = {}) => {
  const queryClient = useQueryClient();

  const handleSystemPromptReady = useCallback(async (event: any) => {
    if (event.type !== 'theme-system-prompt-ready') return;
    
    const { themeId, themeName, category, systemPromptId } = event.payload;
    
    console.log('🔄 Image Generation Retry: System prompt ready for theme:', {
      themeId,
      themeName,
      category,
      systemPromptId,
    });

    try {
      // Trigger image generation for all posts in this theme that don't have images yet
      const { data: posts, error } = await supabase
        .from('social_media_posts')
        .select('id, title, category, image_1_1_status')
        .eq('theme_id', themeId)
        .eq('user_id', userId)
        .in('image_1_1_status', ['pending', 'failed']);

      if (error) {
        console.error('Error fetching posts for retry:', error);
        return;
      }

      if (!posts || posts.length === 0) {
        console.log('No posts need image generation retry for theme:', themeName);
        return;
      }

      console.log(`🎨 Triggering image generation retry for ${posts.length} posts in theme: ${themeName}`);

      // Call the ensure-post-image-prompts edge function
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'ensure-post-image-prompts',
        {
          body: {
            category,
            theme_id: themeId,
            retry_failed: true,
          },
        }
      );

      if (functionError) {
        console.error('Error triggering image generation retry:', functionError);
        toast.error('Failed to start image generation', {
          description: 'Please try again later',
        });
        return;
      }

      console.log('✅ Image generation retry triggered successfully:', response);
      
      toast.success('Image generation started', {
        description: `Processing ${posts.length} posts with enhanced AI prompts`,
        duration: 4000,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });

    } catch (error) {
      console.error('Unexpected error in image generation retry:', error);
    }
  }, [userId, queryClient]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    console.log('🔗 Setting up image generation retry listener for user:', userId);

    // Subscribe to theme-system-prompt-ready events
    const unsubscribe = realtimeEventBus.on('theme-system-prompt-ready', handleSystemPromptReady);

    return () => {
      console.log('🧹 Cleaning up image generation retry listener');
      unsubscribe();
    };
  }, [enabled, userId, handleSystemPromptReady]);

  return {
    isListening: enabled && !!userId,
  };
};