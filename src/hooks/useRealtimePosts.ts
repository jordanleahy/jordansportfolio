import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/realtime-js';
import type { SocialMediaPost } from '@/types/socialMedia';

// Enhanced logging types for QA testing
export interface RealtimeLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: 'Connection' | 'Update' | 'Cache' | 'Performance' | 'Error';
  message: string;
  data?: any;
  sessionId: string;
}

export interface RealtimeMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  totalUpdatesReceived: number;
  totalUpdatesProcessed: number;
  totalCacheInvalidations: number;
  averageProcessingTime: number;
  lastUpdateTimestamp?: number;
  debounceHits: number;
}

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
  onInsert?: (post: SocialMediaPost) => void;
  enableAdvancedLogging?: boolean;
  verboseLogging?: boolean;
}

export const useRealtimePosts = ({ 
  enabled = true, 
  userId,
  onUpdate,
  onInsert,
  enableAdvancedLogging = true,
  verboseLogging = false
}: UseRealtimePostsOptions = {}) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<{ [key: string]: number }>({});
  
  // Advanced logging state
  const [logs, setLogs] = useState<RealtimeLogEntry[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalUpdatesReceived: 0,
    totalUpdatesProcessed: 0,
    totalCacheInvalidations: 0,
    averageProcessingTime: 0,
    debounceHits: 0,
  });
  
  const sessionId = useRef(Math.random().toString(36).substring(7));
  const processingTimesRef = useRef<number[]>([]);

  // Enhanced logging function
  const addLog = (level: RealtimeLogEntry['level'], category: RealtimeLogEntry['category'], message: string, data?: any) => {
    if (!enableAdvancedLogging) return;
    
    const logEntry: RealtimeLogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      sessionId: sessionId.current,
    };
    
    setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
    
    // Console output with enhanced formatting
    const prefix = `[Realtime:${category}]`;
    const timestamp = new Date().toISOString();
    const logMessage = `${prefix} ${timestamp} ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, data);
        break;
      case 'WARN':
        console.warn(logMessage, data);
        break;
      case 'DEBUG':
        if (verboseLogging) console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  };

  // Performance tracking
  const trackPerformance = (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    processingTimesRef.current.push(duration);
    
    // Keep only last 50 measurements for rolling average
    if (processingTimesRef.current.length > 50) {
      processingTimesRef.current = processingTimesRef.current.slice(-50);
    }
    
    const avgTime = processingTimesRef.current.reduce((a, b) => a + b, 0) / processingTimesRef.current.length;
    
    setMetrics(prev => ({
      ...prev,
      averageProcessingTime: avgTime,
    }));
    
    addLog('DEBUG', 'Performance', `${operation} completed in ${duration}ms (avg: ${avgTime.toFixed(2)}ms)`, {
      operation,
      duration,
      averageTime: avgTime,
    });
  };

  useEffect(() => {
    if (!enabled || !userId) {
      addLog('INFO', 'Connection', 'Subscription disabled or no userId', { enabled, userId });
      return;
    }

    addLog('INFO', 'Connection', `Setting up subscription for user: ${userId}`, { userId, sessionId: sessionId.current });
    
    setMetrics(prev => ({
      ...prev,
      connectionAttempts: prev.connectionAttempts + 1,
    }));

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
          const updateStartTime = Date.now();
          addLog('INFO', 'Update', 'Received realtime payload', { 
            payloadType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
          });
          
          setMetrics(prev => ({
            ...prev,
            totalUpdatesReceived: prev.totalUpdatesReceived + 1,
          }));
          
          const newRecord = payload.new as SocialMediaPost;
          const oldRecord = payload.old as SocialMediaPost;
          
          if (!newRecord || !oldRecord) {
            addLog('WARN', 'Update', 'Missing record data in payload', { 
              hasNew: !!newRecord, 
              hasOld: !!oldRecord,
              payload: verboseLogging ? payload : 'Enable verbose logging to see full payload'
            });
            return;
          }

          // Detailed field-by-field change analysis
          const statusChanges = {
            '16_9': { old: oldRecord.image_16_9_status, new: newRecord.image_16_9_status },
            '9_16': { old: oldRecord.image_9_16_status, new: newRecord.image_9_16_status },
            '3_4': { old: oldRecord.image_3_4_status, new: newRecord.image_3_4_status },
            '4_3': { old: oldRecord.image_4_3_status, new: newRecord.image_4_3_status },
          };
          
          const urlChanges = {
            '16_9': { old: oldRecord.image_16_9_url, new: newRecord.image_16_9_url },
            '9_16': { old: oldRecord.image_9_16_url, new: newRecord.image_9_16_url },
            '3_4': { old: oldRecord.image_3_4_url, new: newRecord.image_3_4_url },
            '4_3': { old: oldRecord.image_4_3_url, new: newRecord.image_4_3_url },
          };

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
            addLog('DEBUG', 'Update', 'Non-image update filtered out', {
              postId: newRecord.id,
              category: newRecord.category,
              statusChanges,
              urlChanges,
            });
            return;
          }
          
          addLog('INFO', 'Update', 'Image-related update detected', {
            postId: newRecord.id,
            category: newRecord.category,
            statusChanges,
            urlChanges,
          });

          // Debounce rapid updates (within 1 second)
          const now = Date.now();
          const lastUpdate = lastUpdateRef.current[newRecord.id] || 0;
          const timeSinceLastUpdate = now - lastUpdate;
          
          if (timeSinceLastUpdate < 1000) {
            setMetrics(prev => ({
              ...prev,
              debounceHits: prev.debounceHits + 1,
            }));
            
            addLog('DEBUG', 'Update', `Debouncing rapid update (${timeSinceLastUpdate}ms since last)`, {
              postId: newRecord.id,
              timeSinceLastUpdate,
              debounceThreshold: 1000,
            });
            return;
          }
          lastUpdateRef.current[newRecord.id] = now;

          addLog('INFO', 'Update', `Processing image update for post: ${newRecord.id}`, {
            postId: newRecord.id,
            category: newRecord.category,
            statusTransitions: {
              '16_9': `${oldRecord.image_16_9_status} → ${newRecord.image_16_9_status}`,
              '9_16': `${oldRecord.image_9_16_status} → ${newRecord.image_9_16_status}`,
              '3_4': `${oldRecord.image_3_4_status} → ${newRecord.image_3_4_status}`,
              '4_3': `${oldRecord.image_4_3_status} → ${newRecord.image_4_3_status}`,
            },
            updateProcessingTime: Date.now() - updateStartTime,
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
            addLog('DEBUG', 'Update', 'Calling update callback', { postId: newRecord.id });
            onUpdate(update);
          }

          // Cache invalidation with detailed tracking
          const cacheInvalidationStart = Date.now();
          
          addLog('INFO', 'Cache', `Starting cache invalidation for category: ${newRecord.category}`, {
            category: newRecord.category,
            postId: newRecord.id,
          });
          
          queryClient.invalidateQueries({ 
            queryKey: ['category-posts', newRecord.category] 
          });

          queryClient.invalidateQueries({ 
            queryKey: ['available-categories'] 
          });
          
          setMetrics(prev => ({
            ...prev,
            totalCacheInvalidations: prev.totalCacheInvalidations + 1,
            totalUpdatesProcessed: prev.totalUpdatesProcessed + 1,
            lastUpdateTimestamp: Date.now(),
          }));

          trackPerformance('Cache Invalidation', cacheInvalidationStart);
          trackPerformance('Full Update Processing', updateStartTime);
          
          addLog('INFO', 'Cache', 'Cache invalidation completed', {
            category: newRecord.category,
            invalidationTime: Date.now() - cacheInvalidationStart,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_media_posts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const insertStartTime = Date.now();
          addLog('INFO', 'Update', 'Received INSERT payload', { 
            payloadType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
          });
          
          setMetrics(prev => ({
            ...prev,
            totalUpdatesReceived: prev.totalUpdatesReceived + 1,
          }));
          
          const newRecord = payload.new as SocialMediaPost;
          
          if (!newRecord) {
            addLog('WARN', 'Update', 'Missing record data in INSERT payload', { 
              payload: verboseLogging ? payload : 'Enable verbose logging to see full payload'
            });
            return;
          }

          addLog('INFO', 'Update', 'New post inserted', {
            postId: newRecord.id,
            category: newRecord.category,
            title: newRecord.title,
          });

          // Call insert callback if provided
          if (onInsert) {
            addLog('DEBUG', 'Update', 'Calling insert callback', { postId: newRecord.id });
            onInsert(newRecord);
          }

          // Cache invalidation for new posts
          const cacheInvalidationStart = Date.now();
          
          addLog('INFO', 'Cache', `Starting cache invalidation for new post in category: ${newRecord.category}`, {
            category: newRecord.category,
            postId: newRecord.id,
          });
          
          queryClient.invalidateQueries({ 
            queryKey: ['category-posts', newRecord.category] 
          });

          queryClient.invalidateQueries({ 
            queryKey: ['available-categories'] 
          });
          
          // Also invalidate optimized stories cache
          queryClient.invalidateQueries({ 
            queryKey: ['optimized-stories'] 
          });
          
          setMetrics(prev => ({
            ...prev,
            totalCacheInvalidations: prev.totalCacheInvalidations + 1,
            totalUpdatesProcessed: prev.totalUpdatesProcessed + 1,
            lastUpdateTimestamp: Date.now(),
          }));

          trackPerformance('Insert Cache Invalidation', cacheInvalidationStart);
          trackPerformance('Full Insert Processing', insertStartTime);
          
          addLog('INFO', 'Cache', 'Insert cache invalidation completed', {
            category: newRecord.category,
            invalidationTime: Date.now() - cacheInvalidationStart,
          });
        }
      )
      .subscribe((status) => {
        addLog('INFO', 'Connection', `Subscription status changed: ${status}`, { 
          status, 
          channelName: 'social-media-posts-changes',
          timestamp: new Date().toISOString(),
        });
        
        if (status === 'SUBSCRIBED') {
          setMetrics(prev => ({
            ...prev,
            successfulConnections: prev.successfulConnections + 1,
          }));
          addLog('INFO', 'Connection', 'Successfully subscribed to social_media_posts changes', {
            sessionId: sessionId.current,
            userId,
          });
        } else if (status === 'CHANNEL_ERROR') {
          setMetrics(prev => ({
            ...prev,
            failedConnections: prev.failedConnections + 1,
          }));
          addLog('ERROR', 'Connection', 'Channel error - connection failed', { status });
        } else if (status === 'TIMED_OUT') {
          setMetrics(prev => ({
            ...prev,
            failedConnections: prev.failedConnections + 1,
          }));
          addLog('ERROR', 'Connection', 'Subscription timed out', { status });
        } else if (status === 'CLOSED') {
          addLog('INFO', 'Connection', 'Channel closed', { status });
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      addLog('INFO', 'Connection', 'Cleaning up subscription', { 
        sessionId: sessionId.current,
        channelState: channelRef.current?.state,
      });
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, queryClient, onUpdate, onInsert, enableAdvancedLogging, verboseLogging]);

  return {
    isSubscribed: channelRef.current?.state === 'joined',
    channel: channelRef.current,
    // Advanced logging exports
    logs: enableAdvancedLogging ? logs : [],
    metrics: enableAdvancedLogging ? metrics : {} as RealtimeMetrics,
    sessionId: sessionId.current,
    clearLogs: () => setLogs([]),
    exportLogs: () => ({
      logs,
      metrics,
      sessionInfo: {
        sessionId: sessionId.current,
        timestamp: new Date().toISOString(),
        userId,
      }
    }),
  };
};