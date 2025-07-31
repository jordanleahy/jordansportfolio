import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { IRealtimeConnection, ConnectionStatus } from "../interfaces/IRealtimeConnection";
import { realtimeEventBus } from "./RealtimeEventBus";
import { realtimeLogger } from "./RealtimeLogger";

export class RealtimeConnectionService implements IRealtimeConnection {
  private channel: RealtimeChannel | null = null;
  private status: ConnectionStatus = {
    status: 'disconnected',
    timestamp: Date.now()
  };
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(userId: string): Promise<void> {
    if (this.channel) {
      await this.disconnect();
    }

    this.updateStatus('connecting');
    this.reconnectAttempts++;
    
    realtimeLogger.info('connection', `Connection attempt ${this.reconnectAttempts} for user ${userId}`);
    
    try {
      this.channel = supabase
        .channel(`social_media_posts_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_media_posts',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            realtimeEventBus.emit({
              type: 'update-received',
              payload: {
                table: 'social_media_posts',
                eventType: 'UPDATE',
                data: payload,
                timestamp: Date.now()
              }
            });
          }
        )
        .subscribe((status) => {
          realtimeLogger.info('connection', `Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            this.updateStatus('connected');
            this.reconnectAttempts = 0; // Reset on successful connection
          } else if (status === 'CHANNEL_ERROR') {
            this.updateStatus('error', 'Channel subscription failed');
            this.scheduleReconnect(userId);
          } else if (status === 'CLOSED') {
            this.updateStatus('disconnected');
            this.scheduleReconnect(userId);
          }
        });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      realtimeLogger.error('connection', `Connection failed: ${errorMessage}`);
      this.updateStatus('error', errorMessage);
      this.scheduleReconnect(userId);
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.updateStatus('disconnected');
    realtimeLogger.info('connection', 'Disconnected from realtime');
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private updateStatus(status: ConnectionStatus['status'], error?: string): void {
    this.status = {
      status,
      timestamp: Date.now(),
      error
    };

    // Notify all callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (err) {
        realtimeLogger.error('connection', `Error in status callback: ${err}`);
      }
    });

    // Emit event
    realtimeEventBus.emit({
      type: 'connection-changed',
      payload: {
        status,
        timestamp: this.status.timestamp,
        error
      }
    });
  }

  private scheduleReconnect(userId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      realtimeLogger.error('connection', `Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    realtimeLogger.info('connection', `Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.connect(userId);
    }, delay);
  }
}