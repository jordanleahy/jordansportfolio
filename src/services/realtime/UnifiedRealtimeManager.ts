import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { realtimeEventBus } from "./RealtimeEventBus";
import { realtimeLogger } from "./RealtimeLogger";

export interface ConnectionConfig {
  userId: string;
  enabled: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  connectionTimeout?: number;
}

export interface ChannelSubscription {
  id: string;
  channel: RealtimeChannel;
  userId: string;
  tables: string[];
  subscriberCount: number;
  lastActivity: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  totalReconnects: number;
  averageConnectionTime: number;
}

/**
 * Unified Realtime Manager - Consolidates all realtime connection management
 * Fixes the connection loop issue by ensuring only one connection per user
 */
export class UnifiedRealtimeManager {
  private static instance: UnifiedRealtimeManager;
  private connections = new Map<string, ChannelSubscription>();
  private subscribers = new Map<string, Set<string>>();
  private connectionTimes = new Map<string, number>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private isDestroyed = false;

  private readonly RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly CONNECTION_TIMEOUT = 10000;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly DEBOUNCE_DELAY = 500;

  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): UnifiedRealtimeManager {
    if (!UnifiedRealtimeManager.instance) {
      UnifiedRealtimeManager.instance = new UnifiedRealtimeManager();
    }
    return UnifiedRealtimeManager.instance;
  }

  /**
   * Subscribe to realtime updates for a user
   * Returns an unsubscribe function
   */
  subscribe(config: ConnectionConfig, subscriberId: string): () => void {
    if (this.isDestroyed) {
      realtimeLogger.warn('connection', 'Attempted to subscribe after manager was destroyed');
      return () => {};
    }

    if (!config.enabled || !config.userId) {
      realtimeLogger.info('connection', 'Subscription disabled or no userId provided');
      return () => {};
    }

    const connectionKey = `user_${config.userId}`;

    // Add subscriber to the connection
    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    this.subscribers.get(connectionKey)!.add(subscriberId);

    // Create or reuse existing connection
    this.ensureConnection(config, connectionKey);

    // Return unsubscribe function
    return () => this.unsubscribe(connectionKey, subscriberId);
  }

  private async ensureConnection(config: ConnectionConfig, connectionKey: string): Promise<void> {
    const existing = this.connections.get(connectionKey);
    
    if (existing && existing.status === 'connected') {
      realtimeLogger.debug('connection', `Reusing existing connection for ${connectionKey}`);
      this.updateActivity(connectionKey);
      return;
    }

    if (existing && existing.status === 'connecting') {
      realtimeLogger.debug('connection', `Connection already in progress for ${connectionKey}`);
      return;
    }

    await this.createConnection(config, connectionKey);
  }

  private async createConnection(config: ConnectionConfig, connectionKey: string): Promise<void> {
    const startTime = Date.now();
    this.connectionTimes.set(connectionKey, startTime);

    realtimeLogger.info('connection', `Creating connection for ${connectionKey}`);

    // Clean up any existing connection first
    await this.cleanupConnection(connectionKey);

    const channel = supabase.channel(`unified_${connectionKey}`, {
      config: {
        presence: { key: connectionKey }
      }
    });

    const subscription: ChannelSubscription = {
      id: connectionKey,
      channel,
      userId: config.userId,
      tables: ['social_media_posts', 'themes', 'color_themes', 'theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent', 'openai_agents', 'vendors'],
      subscriberCount: this.subscribers.get(connectionKey)?.size || 0,
      lastActivity: Date.now(),
      status: 'connecting',
      reconnectAttempts: 0,
    };

    this.connections.set(connectionKey, subscription);

    // Subscribe to all relevant tables
    this.setupTableSubscriptions(channel, config.userId);

    // Handle subscription status
    channel.subscribe((status, err) => {
      realtimeLogger.info('connection', `Subscription status for ${connectionKey}: ${status}`, { error: err });
      
      const connection = this.connections.get(connectionKey);
      if (!connection) return;

      if (status === 'SUBSCRIBED') {
        connection.status = 'connected';
        connection.reconnectAttempts = 0;
        this.updateActivity(connectionKey);
        
        const connectionTime = Date.now() - startTime;
        realtimeLogger.info('connection', `Successfully connected ${connectionKey} in ${connectionTime}ms`);
        
        realtimeEventBus.emit({
          type: 'connection-changed',
          payload: {
            status: 'connected',
            timestamp: Date.now(),
          }
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        connection.status = 'error';
        realtimeLogger.error('connection', `Connection failed for ${connectionKey}: ${status}`, { error: err });
        
        if (connection.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect(config, connectionKey);
        } else {
          realtimeLogger.error('connection', `Max reconnection attempts reached for ${connectionKey}`);
        }
      } else if (status === 'CLOSED') {
        connection.status = 'disconnected';
        realtimeLogger.info('connection', `Connection closed for ${connectionKey}`);
      }
    });
  }

  private setupTableSubscriptions(channel: RealtimeChannel, userId: string): void {
    // Social media posts subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'social_media_posts',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('social_media_posts', payload);
      }
    );

    // Themes subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'themes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('themes', payload);
      }
    );

    // Color themes subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'color_themes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('color_themes', payload);
      }
    );

    // System prompts subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent', payload);
      }
    );

    // OpenAI agents subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'openai_agents',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('openai_agents', payload);
      }
    );

    // Vendors subscription
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendors',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('vendors', payload);
      }
    );

    // API usage tracking subscription (credits)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage_tracking',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('api_usage_tracking', payload);
      }
    );

    // Also listen to updates (success can flip from false -> true later)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'api_usage_tracking',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleDebouncedUpdate('api_usage_tracking', payload);
      }
    );
  }

  private handleDebouncedUpdate(table: string, payload: any): void {
    // For themes table, process immediately for instant completion notifications
    if (table === 'themes') {
      this.processUpdate(table, payload);
      return;
    }
    
    const debounceKey = `${table}_${payload.new?.id || payload.old?.id}`;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processUpdate(table, payload);
      this.debounceTimers.delete(debounceKey);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(debounceKey, timer);
  }

  private processUpdate(table: string, payload: any): void {
    realtimeLogger.info('update', `Processing ${payload.eventType} for ${table}`, {
      table,
      eventType: payload.eventType,
      recordId: payload.new?.id || payload.old?.id
    });

    // Emit event to the unified event bus
    realtimeEventBus.emit({
      type: 'update-received',
      payload: {
        table,
        eventType: payload.eventType,
        data: payload,
        timestamp: Date.now()
      }
    });
  }

  private unsubscribe(connectionKey: string, subscriberId: string): void {
    const subscribers = this.subscribers.get(connectionKey);
    if (subscribers) {
      subscribers.delete(subscriberId);
      
      if (subscribers.size === 0) {
        // No more subscribers, clean up connection
        this.scheduleConnectionCleanup(connectionKey);
      }
    }
  }

  private scheduleConnectionCleanup(connectionKey: string): void {
    // Wait a bit before cleanup in case of immediate resubscription
    setTimeout(() => {
      const subscribers = this.subscribers.get(connectionKey);
      if (!subscribers || subscribers.size === 0) {
        this.cleanupConnection(connectionKey);
      }
    }, 5000); // 5 second grace period
  }

  private async cleanupConnection(connectionKey: string): Promise<void> {
    const connection = this.connections.get(connectionKey);
    if (connection) {
      realtimeLogger.info('connection', `Cleaning up connection: ${connectionKey}`);
      
      try {
        await supabase.removeChannel(connection.channel);
      } catch (error) {
        realtimeLogger.error('connection', `Error removing channel: ${error}`);
      }
      
      this.connections.delete(connectionKey);
    }
    
    this.subscribers.delete(connectionKey);
    this.connectionTimes.delete(connectionKey);
    
    // Clear any pending debounce timers
    for (const [key, timer] of this.debounceTimers.entries()) {
      if (key.startsWith(connectionKey)) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
    }
  }

  private scheduleReconnect(config: ConnectionConfig, connectionKey: string): void {
    const connection = this.connections.get(connectionKey);
    if (!connection) return;

    connection.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY * Math.pow(2, connection.reconnectAttempts - 1);
    
    realtimeLogger.info('connection', `Scheduling reconnect for ${connectionKey} in ${delay}ms (attempt ${connection.reconnectAttempts})`);

    setTimeout(() => {
      if (this.subscribers.get(connectionKey)?.size) {
        this.createConnection(config, connectionKey);
      }
    }, delay);
  }

  private updateActivity(connectionKey: string): void {
    const connection = this.connections.get(connectionKey);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    for (const [key, connection] of this.connections.entries()) {
      const subscribers = this.subscribers.get(key);
      const isInactive = (now - connection.lastActivity) > INACTIVE_THRESHOLD;
      const hasNoSubscribers = !subscribers || subscribers.size === 0;

      if (isInactive && hasNoSubscribers) {
        realtimeLogger.info('connection', `Cleaning up inactive connection: ${key}`);
        this.cleanupConnection(key);
      }
    }
  }

  getMetrics(): ConnectionMetrics {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected').length;
    
    const failedConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'error').length;

    const totalReconnects = Array.from(this.connections.values())
      .reduce((sum, conn) => sum + conn.reconnectAttempts, 0);

    const connectionTimes = Array.from(this.connectionTimes.values());
    const averageConnectionTime = connectionTimes.length > 0 
      ? connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length
      : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      failedConnections,
      totalReconnects,
      averageConnectionTime,
    };
  }

  getConnectionStatus(userId: string): 'connected' | 'connecting' | 'disconnected' | 'error' {
    const connectionKey = `user_${userId}`;
    const connection = this.connections.get(connectionKey);
    return connection?.status || 'disconnected';
  }

  destroy(): void {
    this.isDestroyed = true;
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clean up all connections
    const cleanupPromises = Array.from(this.connections.keys()).map(key => 
      this.cleanupConnection(key)
    );

    Promise.all(cleanupPromises).then(() => {
      realtimeLogger.info('connection', 'UnifiedRealtimeManager destroyed');
    });
  }
}

// Export singleton instance
export const unifiedRealtimeManager = UnifiedRealtimeManager.getInstance();