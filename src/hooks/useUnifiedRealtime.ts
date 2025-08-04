import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { unifiedRealtimeManager } from '@/services/realtime/UnifiedRealtimeManager';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { toast } from 'sonner';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { ColorTheme } from '@/types/colorTheme';

export interface UseUnifiedRealtimeOptions {
  enabled?: boolean;
  userId?: string;
  onPostUpdate?: (post: SocialMediaPost) => void;
  onPostInsert?: (post: SocialMediaPost) => void;
  onThemeUpdate?: (theme: ColorTheme) => void;
  onSystemPromptUpdate?: (prompt: any) => void;
  onAgentUpdate?: (agent: any) => void;
}

export const useUnifiedRealtime = ({
  enabled = true,
  userId,
  onPostUpdate,
  onPostInsert,
  onThemeUpdate,
  onSystemPromptUpdate,
  onAgentUpdate,
}: UseUnifiedRealtimeOptions = {}) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const subscriberIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (!enabled || !userId) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    console.log(`[UnifiedRealtime] Setting up realtime for user: ${userId}`);

    // Subscribe to the unified realtime manager
    const unsubscribe = unifiedRealtimeManager.subscribe(
      {
        userId,
        enabled: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 1000,
        connectionTimeout: 10000,
      },
      subscriberIdRef.current
    );

    // Listen for update events
    const handleUpdate = (event: any) => {
      if (event.type !== 'update-received') return;
      
      const { table, eventType, data } = event.payload;
      console.log(`[UnifiedRealtime] Received ${eventType} for ${table}:`, data.new?.id || data.old?.id);

      switch (table) {
        case 'social_media_posts':
          handleSocialMediaPostUpdate(eventType, data);
          break;
        case 'color_themes':
          handleColorThemeUpdate(eventType, data);
          break;
        case 'system_prompts':
          handleSystemPromptUpdate(eventType, data);
          break;
        case 'openai_agents':
          handleAgentUpdate(eventType, data);
          break;
      }
    };

    const handleConnectionChange = (event: any) => {
      if (event.type !== 'connection-changed') return;
      
      const { status } = event.payload;
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
      
      console.log(`[UnifiedRealtime] Connection status changed to: ${status}`);
    };

    // Subscribe to events
    const unsubscribeUpdates = realtimeEventBus.on('update-received', handleUpdate);
    const unsubscribeConnection = realtimeEventBus.on('connection-changed', handleConnectionChange);

    // Update connection status based on current state
    const currentStatus = unifiedRealtimeManager.getConnectionStatus(userId);
    setConnectionStatus(currentStatus);
    setIsConnected(currentStatus === 'connected');

    return () => {
      console.log(`[UnifiedRealtime] Cleaning up realtime for user: ${userId}`);
      unsubscribe();
      unsubscribeUpdates();
      unsubscribeConnection();
    };
  }, [enabled, userId]);

  const handleSocialMediaPostUpdate = (eventType: string, data: any) => {
    const record = data.new as SocialMediaPost;
    const oldRecord = data.old as SocialMediaPost;

    if (eventType === 'INSERT' && record) {
      console.log(`[UnifiedRealtime] New post created: ${record.id} in category: ${record.category}`);
      
      // Call insert callback
      if (onPostInsert) {
        onPostInsert(record);
      }

      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['category-posts', record.category] });
      queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-stories'] });

      toast.success(`New post created in ${record.category}`);
    } else if (eventType === 'UPDATE' && record && oldRecord) {
      // Check if this is an image-related update
      const isImageUpdate = (
        record.image_16_9_status !== oldRecord.image_16_9_status ||
        record.image_9_16_status !== oldRecord.image_9_16_status ||
        record.image_3_4_status !== oldRecord.image_3_4_status ||
        record.image_4_3_status !== oldRecord.image_4_3_status ||
        record.image_16_9_url !== oldRecord.image_16_9_url ||
        record.image_9_16_url !== oldRecord.image_9_16_url ||
        record.image_3_4_url !== oldRecord.image_3_4_url ||
        record.image_4_3_url !== oldRecord.image_4_3_url
      );

      if (isImageUpdate) {
        console.log(`[UnifiedRealtime] Image update for post: ${record.id}`);
        
        // Call update callback
        if (onPostUpdate) {
          onPostUpdate(record);
        }

        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: ['category-posts', record.category] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });

        // Show toast for completed images
        const completedImages = [];
        if (record.image_16_9_status === 'complete' && oldRecord.image_16_9_status !== 'complete') {
          completedImages.push('16:9');
        }
        if (record.image_9_16_status === 'complete' && oldRecord.image_9_16_status !== 'complete') {
          completedImages.push('9:16');
        }
        if (record.image_3_4_status === 'complete' && oldRecord.image_3_4_status !== 'complete') {
          completedImages.push('3:4');
        }
        if (record.image_4_3_status === 'complete' && oldRecord.image_4_3_status !== 'complete') {
          completedImages.push('4:3');
        }

        if (completedImages.length > 0) {
          toast.success(`Images generated: ${completedImages.join(', ')} for "${record.title}"`);
        }
      }
    } else if (eventType === 'DELETE' && oldRecord) {
      console.log(`[UnifiedRealtime] Post deleted: ${oldRecord.id}`);
      
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['category-posts', oldRecord.category] });
      queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-stories'] });
    }
  };

  const handleColorThemeUpdate = (eventType: string, data: any) => {
    const record = data.new as ColorTheme;
    const oldRecord = data.old as ColorTheme;

    console.log(`[UnifiedRealtime] Color theme ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (onThemeUpdate && record) {
        onThemeUpdate(record);
      }
      toast.success(`Color theme ${eventType === 'INSERT' ? 'created' : 'updated'}`);
    } else if (eventType === 'DELETE' && oldRecord) {
      toast.success('Color theme deleted');
    }

    // Invalidate color theme caches
    queryClient.invalidateQueries({ queryKey: ['color-themes'] });
    queryClient.invalidateQueries({ queryKey: ['available-themes'] });
  };

  const handleSystemPromptUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] System prompt ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onSystemPromptUpdate && record) {
      onSystemPromptUpdate(record);
    }

    // Invalidate system prompt caches
    queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
    queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });

    if (eventType === 'UPDATE') {
      toast.success('System prompt updated');
    } else if (eventType === 'DELETE') {
      toast.success('System prompt deleted');
    }
  };

  const handleAgentUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] Agent ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onAgentUpdate && record) {
      onAgentUpdate(record);
    }

    // Invalidate agent caches
    queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
    queryClient.invalidateQueries({ queryKey: ['agent-relationships'] });

    if (eventType === 'INSERT') {
      toast.success('New agent created');
    } else if (eventType === 'UPDATE') {
      toast.success('Agent updated');
    } else if (eventType === 'DELETE') {
      toast.success('Agent deleted');
    }
  };

  return {
    isConnected,
    connectionStatus,
    metrics: unifiedRealtimeManager.getMetrics(),
  };
};