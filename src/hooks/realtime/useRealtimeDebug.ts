import { useEffect, useState } from 'react';
import { realtimeLogger } from '@/services/realtime/RealtimeLogger';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import type { LogEntry, LoggerMetrics } from '@/services/realtime/RealtimeLogger';

interface UseRealtimeDebugOptions {
  enabled?: boolean;
  maxRecentUpdates?: number;
}

export function useRealtimeDebug({ 
  enabled = true, 
  maxRecentUpdates = 10 
}: UseRealtimeDebugOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<LoggerMetrics>({
    connectionAttempts: 0,
    updatesReceived: 0,
    updatesProcessed: 0,
    cacheInvalidations: 0,
    averageProcessingTime: 0,
    debounceHits: 0,
    errors: 0
  });
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Update logs and metrics periodically
    const updateInterval = setInterval(() => {
      setLogs(realtimeLogger.getLogs());
      setMetrics(realtimeLogger.getMetrics());
    }, 1000);

    // Listen for update events to track recent updates
    const unsubscribeUpdates = realtimeEventBus.on('update-received', (event) => {
      if (event.type === 'update-received') {
        setRecentUpdates(prev => {
          const newUpdate = {
            timestamp: event.payload.timestamp,
            table: event.payload.table,
            eventType: event.payload.eventType,
            data: event.payload.data
          };
          
          return [newUpdate, ...prev].slice(0, maxRecentUpdates);
        });
      }
    });

    return () => {
      clearInterval(updateInterval);
      unsubscribeUpdates();
    };
  }, [enabled, maxRecentUpdates]);

  const clearLogs = () => {
    realtimeLogger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    const exportData = realtimeLogger.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredLogs = (level?: LogEntry['level']) => {
    return level ? logs.filter(log => log.level === level) : logs;
  };

  return {
    logs,
    metrics,
    recentUpdates,
    clearLogs,
    exportLogs,
    getFilteredLogs,
    logger: realtimeLogger
  };
}