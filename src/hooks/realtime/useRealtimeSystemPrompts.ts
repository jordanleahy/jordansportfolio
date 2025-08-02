import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectionPoolManager } from '@/services/realtime/RealtimeConnectionPoolManager';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { realtimeLogger } from '@/services/realtime/RealtimeLogger';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface UseRealtimeSystemPromptsOptions {
  enabled?: boolean;
  onPromptUpdated?: (data: any) => void;
}

export function useRealtimeSystemPrompts({ 
  enabled = true, 
  onPromptUpdated 
}: UseRealtimeSystemPromptsOptions = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuthGuard();
  const subscriberIdRef = useRef<string>();

  // Generate unique subscriber ID
  if (!subscriberIdRef.current) {
    subscriberIdRef.current = `system-prompts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  useEffect(() => {
    if (!enabled || !user) return;

    const subscriberId = subscriberIdRef.current!;
    
    realtimeLogger.info('update', `Starting realtime system prompts for user ${user.id}`);
    
    // Get or create realtime connection
    const channel = connectionPoolManager.getOrCreateConnection(user.id, subscriberId);
    
    // Listen for system prompt events
    const unsubscribe = realtimeEventBus.on('update-received', (event) => {
      if (event.type !== 'update-received') return;
      
      const { table, eventType, data } = event.payload;
      
      if (table !== 'system_prompts') return;
      
      realtimeLogger.info('update', 'System prompt update received', {
        eventType,
        category: data?.category,
        hasData: !!data
      });

      // Handle different event types
      if (eventType === 'UPDATE' || eventType === 'INSERT') {
        handleSystemPromptUpdate(data);
      } else if (eventType === 'DELETE') {
        handleSystemPromptDelete(data);
      }
    });

    const handleSystemPromptUpdate = (data: any) => {
      if (!data?.category) return;

      const category = data.category;
      
      // Invalidate specific category cache
      queryClient.invalidateQueries({ 
        queryKey: ['system-prompt-cached', category] 
      });
      
      // Show notification
      toast.success(`System prompt updated: ${category}`, {
        description: `Updated by ${data.agent_name || 'system'}`,
        duration: 4000,
      });

      // Call callback if provided
      if (onPromptUpdated) {
        onPromptUpdated({
          category,
          eventType: 'UPDATE',
          agentName: data.agent_name,
          timestamp: Date.now()
        });
      }

      realtimeLogger.info('update', 'System prompt cache invalidated', {
        category,
        agentName: data.agent_name
      });
    };

    const handleSystemPromptDelete = (data: any) => {
      if (!data?.category) return;

      const category = data.category;
      
      // Invalidate specific category cache
      queryClient.invalidateQueries({ 
        queryKey: ['system-prompt-cached', category] 
      });
      
      // Show notification
      toast.info(`System prompt deleted: ${category}`, {
        description: `Deleted by ${data.agent_name || 'system'}`,
        duration: 4000,
      });

      realtimeLogger.info('update', 'System prompt deleted', {
        category,
        agentName: data.agent_name
      });
    };

    // Cleanup function
    return () => {
      unsubscribe();
      connectionPoolManager.removeSubscriber(user.id, subscriberId);
      realtimeLogger.info('update', `Cleaned up realtime system prompts for user ${user.id}`);
    };
  }, [enabled, user, queryClient, onPromptUpdated]);

  return {
    isConnected: !!user && enabled,
    userId: user?.id
  };
}