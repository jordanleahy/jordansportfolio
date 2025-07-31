import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RealtimeUpdateProcessor } from '@/services/realtime/RealtimeUpdateProcessor';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { realtimeLogger } from '@/services/realtime/RealtimeLogger';
import type { ICacheManager } from '@/services/interfaces/ICacheManager';

// Cache manager implementation using React Query
class ReactQueryCacheManager implements ICacheManager {
  private queryClient: ReturnType<typeof useQueryClient>;
  private invalidationCount = 0;

  constructor(queryClient: ReturnType<typeof useQueryClient>) {
    this.queryClient = queryClient;
  }

  invalidate(keys: string[]): void {
    keys.forEach(key => {
      this.queryClient.invalidateQueries({ queryKey: [key] });
    });
    this.invalidationCount += keys.length;
    
    realtimeLogger.info('cache', `Invalidated ${keys.length} cache keys`, { keys });
    
    realtimeEventBus.emit({
      type: 'cache-invalidated',
      payload: {
        keys,
        timestamp: Date.now()
      }
    });
  }

  invalidatePattern(pattern: string): void {
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey[0];
        return typeof queryKey === 'string' && queryKey.includes(pattern);
      }
    });
    this.invalidationCount++;
    
    realtimeLogger.info('cache', `Invalidated cache pattern: ${pattern}`);
  }

  getInvalidationCount(): number {
    return this.invalidationCount;
  }
}

interface UseRealtimeUpdatesOptions {
  enabled?: boolean;
  onImageComplete?: (data: any) => void;
}

export function useRealtimeUpdates({ 
  enabled = true, 
  onImageComplete 
}: UseRealtimeUpdatesOptions = {}) {
  const queryClient = useQueryClient();
  const processorRef = useRef<RealtimeUpdateProcessor>();
  const cacheManagerRef = useRef<ReactQueryCacheManager>();

  // Initialize processor and cache manager
  if (!processorRef.current) {
    processorRef.current = new RealtimeUpdateProcessor();
  }
  
  if (!cacheManagerRef.current) {
    cacheManagerRef.current = new ReactQueryCacheManager(queryClient);
  }

  useEffect(() => {
    if (!enabled) return;

    const processor = processorRef.current!;
    const cacheManager = cacheManagerRef.current!;

    // Listen for realtime updates
    const unsubscribe = realtimeEventBus.on('update-received', (event) => {
      if (event.type !== 'update-received') return;
      
      const { table, eventType, data } = event.payload;
      
      realtimeLogger.info('update', 'Realtime update received', {
        table,
        eventType,
        hasData: !!data
      });

      // Process the update
      const processedUpdate = processor.process({
        table,
        eventType: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        new: data.new,
        old: data.old,
        timestamp: event.payload.timestamp
      });

      if (processedUpdate) {
        // Handle cache invalidation
        if (processedUpdate.shouldInvalidateCache && processedUpdate.cacheKeys) {
          cacheManager.invalidate(processedUpdate.cacheKeys);
        }

        // Handle specific update types
        if (processedUpdate.type === 'image_status_change') {
          const { newImageStatus, title, newImageUrl } = processedUpdate.data;
          
          if (newImageStatus === 'completed' && newImageUrl) {
            // Show success notification
            toast.success(`Image generated for "${title}"`, {
              description: 'The post image has been generated successfully',
              duration: 4000,
            });

            // Call callback if provided
            if (onImageComplete) {
              onImageComplete(processedUpdate.data);
            }
          }
        }

        realtimeLogger.info('update', 'Update processed successfully', {
          type: processedUpdate.type,
          shouldInvalidateCache: processedUpdate.shouldInvalidateCache
        });
      }
    });

    // Cleanup old debounce entries periodically
    const cleanupInterval = setInterval(() => {
      processor.cleanupDebounceHistory();
    }, 60000); // Every minute

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [enabled, onImageComplete]);

  return {
    processor: processorRef.current,
    cacheManager: cacheManagerRef.current
  };
}