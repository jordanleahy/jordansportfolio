export type RealtimeEvent = 
  | { type: 'connection-changed'; payload: { status: string; timestamp: number; error?: string } }
  | { type: 'update-received'; payload: { table: string; eventType: string; data: any; timestamp: number } }
  | { type: 'cache-invalidated'; payload: { keys: string[]; timestamp: number } }
  | { type: 'color-theme-changed'; payload: { action: 'created' | 'updated' | 'deleted'; theme: any; timestamp: number } }
  | { type: 'error'; payload: { error: string; context: string; timestamp: number } };

type EventListener<T = RealtimeEvent> = (event: T) => void;

interface BatchedEvent {
  event: RealtimeEvent;
  timestamp: number;
}

export class RealtimeEventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventBatch: BatchedEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private recentEvents = new Map<string, number>(); // For deduplication
  private cleanupTimer: NodeJS.Timeout;
  
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 100; // ms
  private readonly DEDUP_WINDOW = 1000; // ms
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Setup cleanup timer for deduplication map
    this.cleanupTimer = setInterval(() => {
      this.cleanupRecentEvents();
    }, this.CLEANUP_INTERVAL);
  }

  emit<T extends RealtimeEvent>(event: T): void {
    // Check for duplicates
    const eventKey = this.getEventKey(event);
    const now = Date.now();
    const lastEventTime = this.recentEvents.get(eventKey);
    
    if (lastEventTime && (now - lastEventTime) < this.DEDUP_WINDOW) {
      console.log(`🔄 [EventBus] Deduplicated event: ${event.type}`);
      return;
    }
    
    this.recentEvents.set(eventKey, now);
    
    // Add to batch
    this.eventBatch.push({ event, timestamp: now });
    
    // Process batch if it's full
    if (this.eventBatch.length >= this.BATCH_SIZE) {
      this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch processing
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_TIMEOUT);
    }
  }

  private getEventKey(event: RealtimeEvent): string {
    switch (event.type) {
      case 'color-theme-changed':
        return `${event.type}-${event.payload.action}-${event.payload.theme?.id || 'unknown'}`;
      case 'update-received':
        return `${event.type}-${event.payload.table}-${event.payload.eventType}-${event.payload.data?.id || 'unknown'}`;
      default:
        return `${event.type}-${JSON.stringify(event.payload)}`;
    }
  }

  private processBatch(): void {
    if (this.eventBatch.length === 0) return;
    
    const batch = [...this.eventBatch];
    this.eventBatch = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    console.log(`📦 [EventBus] Processing batch of ${batch.length} events`);
    
    // Group events by type for efficient processing
    const eventsByType = new Map<string, BatchedEvent[]>();
    
    batch.forEach(batchedEvent => {
      const { event } = batchedEvent;
      if (!eventsByType.has(event.type)) {
        eventsByType.set(event.type, []);
      }
      eventsByType.get(event.type)!.push(batchedEvent);
    });
    
    // Emit events by type
    eventsByType.forEach((events, eventType) => {
      const listeners = this.listeners.get(eventType) || [];
      if (listeners.length === 0) return;
      
      events.forEach(({ event }) => {
        listeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error(`Error in event listener for ${event.type}:`, error);
          }
        });
      });
    });
  }

  private cleanupRecentEvents(): void {
    const now = Date.now();
    const cutoff = now - this.DEDUP_WINDOW * 2; // Keep extra buffer
    
    for (const [key, timestamp] of this.recentEvents.entries()) {
      if (timestamp < cutoff) {
        this.recentEvents.delete(key);
      }
    }
    
    console.log(`🧹 [EventBus] Cleaned up recent events, ${this.recentEvents.size} remaining`);
  }

  on<T extends RealtimeEvent>(
    eventType: T['type'], 
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener as EventListener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener as EventListener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  off(eventType: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
    this.eventBatch = [];
    this.recentEvents.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  getStats() {
    return {
      listeners: this.listeners.size,
      batchedEvents: this.eventBatch.length,
      recentEvents: this.recentEvents.size,
      hasBatchTimer: !!this.batchTimer
    };
  }
}

// Global event bus instance
export const realtimeEventBus = new RealtimeEventBus();