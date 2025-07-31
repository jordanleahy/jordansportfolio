import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/realtime-js';
import type { SocialMediaPost } from '@/types/socialMedia';

export interface RealtimePostUpdate {
  postId: string;
  category: string;
  imageStatuses: {
    image_16_9_status?: string;
    image_9_16_status?: string;
    image_3_4_status?: string;
    image_4_3_status?: string;
  };
  imageUrls: {
    image_16_9_url?: string;
    image_9_16_url?: string;
    image_3_4_url?: string;
    image_4_3_url?: string;
  };
}

interface UseRealtimePostsOptions {
  enabled?: boolean;
  userId?: string;
  onUpdate?: (update: RealtimePostUpdate) => void;
}

export const useRealtimePosts = ({ 
  enabled = true, 
  userId,
  onUpdate 
}: UseRealtimePostsOptions = {}) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (!enabled || !userId) {
      console.log('[Realtime] Disabled or no userId:', { enabled, userId });
      return;
    }

    console.log('[Realtime] Setting up subscription for user:', userId);

    // Create realtime channel
    const channel = supabase
      .channel('social-media-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_media_posts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Received update payload:', payload);
          
          const newRecord = payload.new as SocialMediaPost;
          const oldRecord = payload.old as SocialMediaPost;
          
          if (!newRecord || !oldRecord) {
            console.log('[Realtime] Missing record data, skipping update');
            return;
          }

          // Check if this is an image-related update
          const isImageUpdate = (
            newRecord.image_16_9_status !== oldRecord.image_16_9_status ||
            newRecord.image_9_16_status !== oldRecord.image_9_16_status ||
            newRecord.image_3_4_status !== oldRecord.image_3_4_status ||
            newRecord.image_4_3_status !== oldRecord.image_4_3_status ||
            newRecord.image_16_9_url !== oldRecord.image_16_9_url ||
            newRecord.image_9_16_url !== oldRecord.image_9_16_url ||
            newRecord.image_3_4_url !== oldRecord.image_3_4_url ||
            newRecord.image_4_3_url !== oldRecord.image_4_3_url
          );

          if (!isImageUpdate) {
            console.log('[Realtime] Not an image update, skipping');
            return;
          }

          // Debounce rapid updates (within 1 second)
          const now = Date.now();
          const lastUpdate = lastUpdateRef.current[newRecord.id] || 0;
          if (now - lastUpdate < 1000) {
            console.log('[Realtime] Debouncing rapid update');
            return;
          }
          lastUpdateRef.current[newRecord.id] = now;

          console.log('[Realtime] Processing image update for post:', newRecord.id);
          console.log('[Realtime] Category:', newRecord.category);
          console.log('[Realtime] Status changes:', {
            '16_9': `${oldRecord.image_16_9_status} → ${newRecord.image_16_9_status}`,
            '9_16': `${oldRecord.image_9_16_status} → ${newRecord.image_9_16_status}`,
            '3_4': `${oldRecord.image_3_4_status} → ${newRecord.image_3_4_status}`,
            '4_3': `${oldRecord.image_4_3_status} → ${newRecord.image_4_3_status}`,
          });

          // Create update object for callback
          const update: RealtimePostUpdate = {
            postId: newRecord.id,
            category: newRecord.category,
            imageStatuses: {
              image_16_9_status: newRecord.image_16_9_status,
              image_9_16_status: newRecord.image_9_16_status,
              image_3_4_status: newRecord.image_3_4_status,
              image_4_3_status: newRecord.image_4_3_status,
            },
            imageUrls: {
              image_16_9_url: newRecord.image_16_9_url,
              image_9_16_url: newRecord.image_9_16_url,
              image_3_4_url: newRecord.image_3_4_url,
              image_4_3_url: newRecord.image_4_3_url,
            }
          };

          // Call update callback if provided
          if (onUpdate) {
            onUpdate(update);
          }

          // Invalidate relevant queries to trigger UI refresh
          console.log('[Realtime] Invalidating category cache for:', newRecord.category);
          queryClient.invalidateQueries({ 
            queryKey: ['category-posts', newRecord.category] 
          });

          // Also invalidate the general available categories query
          queryClient.invalidateQueries({ 
            queryKey: ['available-categories'] 
          });

          console.log('[Realtime] Cache invalidation completed');
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to social_media_posts changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - retrying subscription');
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] Subscription timed out');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, queryClient, onUpdate]);

  return {
    isSubscribed: channelRef.current?.state === 'joined',
    channel: channelRef.current,
  };
};