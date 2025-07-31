import { useEffect, useState, useRef } from 'react';
import { RealtimeConnectionService } from '@/services/realtime/RealtimeConnectionService';
import type { ConnectionStatus } from '@/services/interfaces/IRealtimeConnection';

interface UseRealtimeConnectionOptions {
  enabled?: boolean;
  userId?: string;
}

export function useRealtimeConnection({ enabled = true, userId }: UseRealtimeConnectionOptions) {
  const [status, setStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    timestamp: Date.now()
  });
  
  const connectionServiceRef = useRef<RealtimeConnectionService>();
  const unsubscribeRef = useRef<() => void>();

  // Initialize connection service
  if (!connectionServiceRef.current) {
    connectionServiceRef.current = new RealtimeConnectionService();
  }

  useEffect(() => {
    const service = connectionServiceRef.current!;

    if (enabled && userId) {
      // Subscribe to status changes
      unsubscribeRef.current = service.onStatusChange(setStatus);
      
      // Start connection
      service.connect(userId);
    } else {
      // Disconnect if disabled or no userId
      service.disconnect();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionServiceRef.current) {
        connectionServiceRef.current.disconnect();
      }
    };
  }, []);

  return {
    status,
    isConnected: status.status === 'connected',
    isConnecting: status.status === 'connecting',
    hasError: status.status === 'error',
    connectionService: connectionServiceRef.current
  };
}