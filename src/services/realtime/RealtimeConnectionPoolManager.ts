import { supabase } from '@/integrations/supabase/client';
import { realtimeEventBus } from './RealtimeEventBus';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PooledConnection {
  channel: RealtimeChannel;
  userId: string;
  lastActivity: number;
  subscribers: Set<string>;
}

export class RealtimeConnectionPoolManager {
  private static instance: RealtimeConnectionPoolManager;
  private connections = new Map<string, PooledConnection>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  private constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.CLEANUP_INTERVAL);
  }

  static getInstance(): RealtimeConnectionPoolManager {
    if (!RealtimeConnectionPoolManager.instance) {
      RealtimeConnectionPoolManager.instance = new RealtimeConnectionPoolManager();
    }
    return RealtimeConnectionPoolManager.instance;
  }

  getOrCreateConnection(userId: string, subscriberId: string): RealtimeChannel {
    const connectionKey = `user_${userId}`;
    let pooledConnection = this.connections.get(connectionKey);

    if (!pooledConnection) {
      console.log(`🔌 [ConnectionPool] Creating new connection for user ${userId}`);
      
      const channel = supabase
        .channel(`realtime_user_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'color_themes',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            this.updateActivity(connectionKey);
            realtimeEventBus.emit({
              type: 'color-theme-changed',
              payload: {
                action: payload.eventType === 'INSERT' ? 'created' : 
                        payload.eventType === 'UPDATE' ? 'updated' : 'deleted',
                theme: payload.new || payload.old,
                timestamp: Date.now()
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'system_prompts',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            this.updateActivity(connectionKey);
            realtimeEventBus.emit({
              type: 'update-received',
              payload: {
                table: 'system_prompts',
                eventType: payload.eventType,
                data: payload.new || payload.old,
                timestamp: Date.now()
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_media_posts',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            this.updateActivity(connectionKey);
            // Only emit if image status changed
            if (payload.new?.image_status !== payload.old?.image_status) {
              realtimeEventBus.emit({
                type: 'update-received',
                payload: {
                  table: 'social_media_posts',
                  eventType: 'image_status_change',
                  data: payload.new,
                  timestamp: Date.now()
                }
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'openai_agents',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            this.updateActivity(connectionKey);
            // Only emit if system_prompts changed
            if (JSON.stringify(payload.new?.system_prompts) !== JSON.stringify(payload.old?.system_prompts)) {
              realtimeEventBus.emit({
                type: 'update-received',
                payload: {
                  table: 'openai_agents',
                  eventType: 'UPDATE',
                  data: payload.new,
                  timestamp: Date.now()
                }
              });
            }
          }
        )
        .subscribe((status) => {
          realtimeEventBus.emit({
            type: 'connection-changed',
            payload: {
              status: status,
              timestamp: Date.now()
            }
          });
        });

      pooledConnection = {
        channel,
        userId,
        lastActivity: Date.now(),
        subscribers: new Set([subscriberId])
      };

      this.connections.set(connectionKey, pooledConnection);
    } else {
      console.log(`🔌 [ConnectionPool] Reusing existing connection for user ${userId}`);
      pooledConnection.subscribers.add(subscriberId);
      this.updateActivity(connectionKey);
    }

    return pooledConnection.channel;
  }

  removeSubscriber(userId: string, subscriberId: string): void {
    const connectionKey = `user_${userId}`;
    const pooledConnection = this.connections.get(connectionKey);

    if (pooledConnection) {
      pooledConnection.subscribers.delete(subscriberId);
      
      if (pooledConnection.subscribers.size === 0) {
        console.log(`🔌 [ConnectionPool] Marking connection for cleanup: ${connectionKey}`);
        // Don't immediately remove - let cleanup handle it after idle timeout
        this.updateActivity(connectionKey);
      }
    }
  }

  private updateActivity(connectionKey: string): void {
    const pooledConnection = this.connections.get(connectionKey);
    if (pooledConnection) {
      pooledConnection.lastActivity = Date.now();
    }
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    
    for (const [key, connection] of this.connections.entries()) {
      const isIdle = now - connection.lastActivity > this.IDLE_TIMEOUT;
      const hasNoSubscribers = connection.subscribers.size === 0;
      
      if (isIdle && hasNoSubscribers) {
        console.log(`🧹 [ConnectionPool] Cleaning up idle connection: ${key}`);
        supabase.removeChannel(connection.channel);
        this.connections.delete(key);
      }
    }
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([key, conn]) => ({
        key,
        userId: conn.userId,
        subscribers: conn.subscribers.size,
        lastActivity: conn.lastActivity,
        idleTime: Date.now() - conn.lastActivity
      }))
    };
  }

  destroy(): void {
    console.log('🔌 [ConnectionPool] Destroying all connections');
    
    for (const [key, connection] of this.connections.entries()) {
      supabase.removeChannel(connection.channel);
    }
    
    this.connections.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const connectionPoolManager = RealtimeConnectionPoolManager.getInstance();