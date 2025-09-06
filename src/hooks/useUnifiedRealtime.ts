import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { unifiedRealtimeManager } from '@/services/realtime/UnifiedRealtimeManager';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { QUERY_KEYS, getThemeQueryKeys } from '@/constants/queryKeys';
import { toast } from 'sonner';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { ColorTheme } from '@/types/colorTheme';

export interface UseUnifiedRealtimeOptions {
  enabled?: boolean;
  userId?: string;
  onPostUpdate?: (post: SocialMediaPost) => void;
  onPostInsert?: (post: SocialMediaPost) => void;
  onThemeUpdate?: (theme: ColorTheme) => void;
  onThemeStatusUpdate?: (theme: any) => void;
  onSystemPromptUpdate?: (prompt: any) => void;
  onAgentUpdate?: (agent: any) => void;
  onVendorUpdate?: (vendor: any) => void;
  onAgentTemplateUpdate?: (template: any) => void;
  onAgentCategoryUpdate?: (category: any) => void;
  onAgentModelOptionUpdate?: (modelOption: any) => void;
  onApiUsageUpdate?: () => void;
}

export const useUnifiedRealtime = ({
  enabled = true,
  userId,
  onPostUpdate,
  onPostInsert,
  onThemeUpdate,
  onThemeStatusUpdate,
  onSystemPromptUpdate,
  onAgentUpdate,
  onVendorUpdate,
  onAgentTemplateUpdate,
  onAgentCategoryUpdate,
  onAgentModelOptionUpdate,
  onApiUsageUpdate,
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
      case 'themes':
        handleThemeStatusUpdate(eventType, data);
        break;
        case 'color_themes':
          handleColorThemeUpdate(eventType, data);
          break;
        case 'theme_system_prompts':
          handleSystemPromptUpdate(eventType, data);
          break;
        case 'openai_agents':
          handleAgentUpdate(eventType, data);
          break;
        case 'vendors':
          handleVendorUpdate(eventType, data);
          break;
        case 'agent_templates':
          handleAgentTemplateUpdate(eventType, data);
          break;
        case 'agent_categories':
          handleAgentCategoryUpdate(eventType, data);
          break;
        case 'agent_model_options':
          handleAgentModelOptionUpdate(eventType, data);
          break;
        case 'api_usage_tracking': {
          // Simplified: just trigger callbacks for any usage tracking changes
          // Individual hooks will handle their own real-time subscriptions
          onApiUsageUpdate?.();
          break;
        }
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

      // Use optimistic updates instead of invalidations
      queryClient.setQueryData(QUERY_KEYS.themes, (oldThemes: any) => {
        if (!oldThemes) return oldThemes;
        // Optimistically update themes list
        return oldThemes;
      });
      
      // Background refetch for affected data
      queryClient.refetchQueries({ 
        queryKey: QUERY_KEYS.postsByCategory(record.category), 
        type: 'active' 
      });

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
        console.log(`🎨 REALTIME: Image update detected for post: ${record.id}`, {
          category: record.category,
          statusChanges: {
            '16_9': `${oldRecord.image_16_9_status} → ${record.image_16_9_status}`,
            '9_16': `${oldRecord.image_9_16_status} → ${record.image_9_16_status}`,
            '3_4': `${oldRecord.image_3_4_status} → ${record.image_3_4_status}`,
            '4_3': `${oldRecord.image_4_3_status} → ${record.image_4_3_status}`
          },
          urlChanges: {
            '16_9': oldRecord.image_16_9_url !== record.image_16_9_url ? 'CHANGED' : 'same',
            '9_16': oldRecord.image_9_16_url !== record.image_9_16_url ? 'CHANGED' : 'same',
            '3_4': oldRecord.image_3_4_url !== record.image_3_4_url ? 'CHANGED' : 'same',
            '4_3': oldRecord.image_4_3_url !== record.image_4_3_url ? 'CHANGED' : 'same'
          }
        });
        
        // Call update callback
        if (onPostUpdate) {
          console.log(`🔄 REALTIME: Calling onPostUpdate callback for post: ${record.id}`);
          onPostUpdate(record);
        } else {
          console.warn(`⚠️ REALTIME: No onPostUpdate callback available for post: ${record.id}`);
        }

        // Use optimistic updates for better performance
        queryClient.setQueryData(QUERY_KEYS.postsByCategory(record.category), (oldPosts: any) => {
          if (!oldPosts) return oldPosts;
          // Optimistically update the specific post
          return oldPosts.map((post: any) => 
            post.id === record.id ? { ...post, ...record } : post
          );
        });
        
        // Background refetch to ensure consistency
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.postsByCategory(record.category), 
          type: 'active' 
        });

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
      
      // Use background refetch for deletions
      queryClient.refetchQueries({ 
        queryKey: QUERY_KEYS.postsByCategory(oldRecord.category), 
        type: 'active' 
      });
      queryClient.refetchQueries({ 
        queryKey: QUERY_KEYS.themes, 
        type: 'active' 
      });
    }
  };

  const handleThemeStatusUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    if (!record) return;

    console.log(`🎨 REALTIME: Theme ${eventType} event:`, {
      theme: record.theme_name,
      category: record.category,
      promptStatus: record.prompt_generation_status,
      lifecycleStatus: record.lifecycle_status,
      systemPromptId: record.visual_prompt_system_prompt_id,
    });

    // Handle theme updates, particularly system prompt linking and status changes
    if (eventType === 'UPDATE' && record && oldRecord) {
      const promptStatusChanged = record.prompt_generation_status !== oldRecord.prompt_generation_status;
      const lifecycleStatusChanged = record.lifecycle_status !== oldRecord.lifecycle_status;
      const systemPromptLinked = record.visual_prompt_system_prompt_id && !oldRecord.visual_prompt_system_prompt_id;
      
      if (promptStatusChanged || lifecycleStatusChanged || systemPromptLinked) {
        console.log(`🔄 REALTIME: Theme status change detected:`, {
          theme: record.theme_name,
          promptStatus: `${oldRecord.prompt_generation_status} → ${record.prompt_generation_status}`,
          lifecycleStatus: `${oldRecord.lifecycle_status} → ${record.lifecycle_status}`,
          systemPromptLinked: systemPromptLinked ? 'YES' : 'NO',
        });

        // SINGLE TRIGGER: System prompt is now linked - trigger image generation
        if (systemPromptLinked) {
          console.log(`🚀 REALTIME: System prompt linked to theme ${record.theme_name} - triggering ensure-post-image-prompts`);
          console.log(`🔍 REALTIME: Debug record data:`, {
            id: record.id,
            category: record.category,
            user_id: record.user_id,
            theme_name: record.theme_name,
            hasValidData: !!(record.category && record.user_id && record.id)
          });
          
          // Validate required fields before calling function
          if (!record.category || !record.user_id || !record.id) {
            console.error('❌ REALTIME: Missing required fields for ensure-post-image-prompts:', {
              category: record.category,
              user_id: record.user_id,
              id: record.id
            });
            return;
          }
          
          // Single trigger for image generation when system prompt becomes available
          import('@/integrations/supabase/client').then(({ supabase }) => {
            supabase.functions.invoke('ensure-post-image-prompts', {
              body: {
                category: record.category,
                themeId: record.id, // Fixed: was theme_id, now themeId
                userId: record.user_id,
              },
            }).then(result => {
              if (result.error) {
                console.warn('⚠️ ensure-post-image-prompts warning:', result.error);
              } else {
                console.log('✅ ensure-post-image-prompts triggered successfully:', result.data);
              }
            }).catch(error => {
              console.error('❌ ensure-post-image-prompts failed:', error);
            });
          });

          toast.success(`Theme "${record.theme_name}" ready`, {
            description: 'Starting image generation with AI prompts',
            duration: 3000,
          });
        }

        // Call theme status update callback
        if (onThemeStatusUpdate) {
          onThemeStatusUpdate({
            id: record.id,
            changes: {
              prompt_generation_status: record.prompt_generation_status,
              lifecycle_status: record.lifecycle_status,
              visual_prompt_system_prompt_id: record.visual_prompt_system_prompt_id,
              updated_at: record.updated_at,
            },
            old_record: oldRecord,
            new_record: record,
          });
        }

        // Invalidate theme-related queries when status changes
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.themes });
        
        // Show notification for significant status changes
        if (record.prompt_generation_status === 'completed' && oldRecord.prompt_generation_status !== 'completed') {
          toast.success(`Theme "${record.theme_name}" is ready`, {
            description: 'All prompts have been generated successfully',
            duration: 3000,
          });
        }
      }
    }

    if (onThemeUpdate) {
      onThemeUpdate(record);
    }
  };

  const handleColorThemeUpdate = (eventType: string, data: any) => {
    const record = data.new as ColorTheme;
    const oldRecord = data.old as ColorTheme;

    console.log(`[UnifiedRealtime] Color theme ${eventType}: ${record?.id || oldRecord?.id}`);
    
    // Emit specific color theme event for backward compatibility
    let action: 'created' | 'updated' | 'deleted';
    if (eventType === 'INSERT') {
      action = 'created';
    } else if (eventType === 'UPDATE') {
      action = 'updated';
    } else {
      action = 'deleted';
    }

    realtimeEventBus.emit({
      type: 'color-theme-changed',
      payload: {
        action,
        theme: record || oldRecord,
        timestamp: Date.now()
      }
    });
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (onThemeUpdate && record) {
        onThemeUpdate(record);
      }
      toast.success(`Color theme ${eventType === 'INSERT' ? 'created' : 'updated'}`);
    } else if (eventType === 'DELETE' && oldRecord) {
      toast.success('Color theme deleted');
    }

    // Invalidate color theme caches with proper query keys
    queryClient.invalidateQueries({ queryKey: ['color-themes'] });
    queryClient.invalidateQueries({ queryKey: ['color-theme'] });
    queryClient.invalidateQueries({ queryKey: ['color-theme', 'default'] });
  };

  const handleSystemPromptUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] System prompt ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onSystemPromptUpdate && record) {
      onSystemPromptUpdate(record);
    }

    // Enhanced reactive system prompt handling
    if (eventType === 'INSERT' && record) {
      console.log('🎨 NEW System prompt created via real-time:', {
        id: record.id,
        theme_id: record.theme_id,
        category: record.category,
        user_id: record.user_id
      });

      // Show success notification to user
      toast.success('AI System Prompt Ready', {
        description: 'Enhanced prompts are now available for better image generation',
        duration: 4000,
      });

      // NOTE: No longer triggering ensure-post-image-prompts here
      // The single trigger in handleThemeStatusUpdate will handle this 
      // when visual_prompt_system_prompt_id is linked to the theme
    }

    // Invalidate system prompt caches
    queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
    queryClient.invalidateQueries({ queryKey: ['cached-prompts'] });
    queryClient.invalidateQueries({ queryKey: ['themes'] });
    queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });

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

  const handleVendorUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] Vendor ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onVendorUpdate && record) {
      onVendorUpdate(record);
    }

    // Invalidate vendor caches
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    queryClient.invalidateQueries({ queryKey: ['vendor'] });

    if (eventType === 'INSERT') {
      toast.success('New vendor created');
    } else if (eventType === 'UPDATE') {
      toast.success('Vendor updated');
    } else if (eventType === 'DELETE') {
      toast.success('Vendor deleted');
    }
  };

  const handleAgentTemplateUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] Agent template ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onAgentTemplateUpdate && record) {
      onAgentTemplateUpdate(record);
    }

    // Invalidate agent template caches
    queryClient.invalidateQueries({ queryKey: ['agent-templates'] });

    if (eventType === 'INSERT') {
      toast.success('New agent template created');
    } else if (eventType === 'UPDATE') {
      toast.success('Agent template updated');
    } else if (eventType === 'DELETE') {
      toast.success('Agent template deleted');
    }
  };

  const handleAgentCategoryUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] Agent category ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onAgentCategoryUpdate && record) {
      onAgentCategoryUpdate(record);
    }

    // Invalidate agent category caches
    queryClient.invalidateQueries({ queryKey: ['agent-categories'] });

    if (eventType === 'INSERT') {
      toast.success('New agent category created');
    } else if (eventType === 'UPDATE') {
      toast.success('Agent category updated');
    } else if (eventType === 'DELETE') {
      toast.success('Agent category deleted');
    }
  };

  const handleAgentModelOptionUpdate = (eventType: string, data: any) => {
    const record = data.new;
    const oldRecord = data.old;

    console.log(`[UnifiedRealtime] Agent model option ${eventType}: ${record?.id || oldRecord?.id}`);
    
    if (onAgentModelOptionUpdate && record) {
      onAgentModelOptionUpdate(record);
    }

    // Invalidate agent model option caches
    queryClient.invalidateQueries({ queryKey: ['agent-model-options'] });

    if (eventType === 'INSERT') {
      toast.success('New model option added');
    } else if (eventType === 'UPDATE') {
      toast.success('Model option updated');
    } else if (eventType === 'DELETE') {
      toast.success('Model option removed');
    }
  };

  return {
    isConnected,
    connectionStatus,
    metrics: unifiedRealtimeManager.getMetrics(),
  };
};