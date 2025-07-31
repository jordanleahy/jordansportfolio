export type RealtimeEvent = 
  | { type: 'connection-changed'; payload: { status: string; timestamp: number; error?: string } }
  | { type: 'update-received'; payload: { table: string; eventType: string; data: any; timestamp: number } }
  | { type: 'cache-invalidated'; payload: { keys: string[]; timestamp: number } }
  | { type: 'error'; payload: { error: string; context: string; timestamp: number } };

type EventListener<T = RealtimeEvent> = (event: T) => void;

export class RealtimeEventBus {
  private listeners: Map<string, EventListener[]> = new Map();

  emit<T extends RealtimeEvent>(event: T): void {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });
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
  }
}

// Global event bus instance
export const realtimeEventBus = new RealtimeEventBus();