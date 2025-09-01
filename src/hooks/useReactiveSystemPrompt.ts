import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemPromptUpdate {
  id: string;
  theme_id: string;
  user_id: string;
  prompt_text: string;
  category: string;
  created_at: string;
}

interface UseReactiveSystemPromptOptions {
  enabled?: boolean;
  userId?: string;
  themeId?: string;
  onSystemPromptReady?: (systemPrompt: SystemPromptUpdate) => void;
}

/**
 * Reactive hook for system prompt generation that uses real-time database events
 * instead of polling or timeouts. This eliminates the timeout mismatches between
 * the pipeline (45s) and OpenAI calls (up to 180s).
 */
export const useReactiveSystemPrompt = ({
  enabled = true,
  userId,
  themeId,
  onSystemPromptReady,
}: UseReactiveSystemPromptOptions = {}) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const subscriberIdRef = useRef(Math.random().toString(36).substring(7));

  const handleSystemPromptUpdate = useCallback(
    (payload: any) => {
      console.log('🔄 Real-time system prompt update received:', payload);
      
      const { new: newPrompt, eventType } = payload;
      
      // Only handle inserts for new system prompts
      if (eventType === 'INSERT' && newPrompt) {
        const systemPrompt: SystemPromptUpdate = {
          id: newPrompt.id,
          theme_id: newPrompt.theme_id,
          user_id: newPrompt.user_id,
          prompt_text: newPrompt.prompt_text,
          category: newPrompt.category,
          created_at: newPrompt.created_at,
        };

        // Filter for the current user and theme if specified
        if (userId && systemPrompt.user_id !== userId) {
          return;
        }
        
        if (themeId && systemPrompt.theme_id !== themeId) {
          return;
        }

        console.log('✅ System prompt ready for theme:', systemPrompt.theme_id);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
        queryClient.invalidateQueries({ queryKey: ['themes'] });
        
        // Show success notification
        toast.success('System prompt generated', {
          description: 'AI prompts are now enhanced for better image generation',
          duration: 3000,
        });

        // Call the callback if provided
        onSystemPromptReady?.(systemPrompt);
        
        // Note: Theme linking happens in the edge function, which will trigger
        // a theme UPDATE event that useUnifiedRealtime handles for image generation retry
      }
    },
    [userId, themeId, onSystemPromptReady, queryClient]
  );

  useEffect(() => {
    if (!enabled || !userId) {
      // Clean up existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    console.log('🔗 Setting up reactive system prompt subscription for user:', userId);

    // Create a new channel for system prompt updates
    const channel = supabase
      .channel(`system-prompts-reactive-${subscriberIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_prompts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handleSystemPromptUpdate({
            ...payload,
            eventType: 'INSERT',
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 System prompt real-time subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up system prompt real-time subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, handleSystemPromptUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    isSubscribed: !!channelRef.current,
  };
};