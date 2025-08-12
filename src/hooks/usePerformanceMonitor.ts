import { useState, useCallback, useRef } from 'react';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  success?: boolean;
  error?: string;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  errorRate: number;
  operationsByType: Record<string, number>;
  recentErrors: string[];
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const activeOperations = useRef<Map<string, PerformanceMetric>>(new Map());
  
  const startOperation = useCallback((operation: string, metadata?: Record<string, any>) => {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      metadata
    };
    
    activeOperations.current.set(operationId, metric);
    return operationId;
  }, []);

  const endOperation = useCallback((
    operationId: string, 
    success: boolean = true, 
    error?: string,
    additionalMetadata?: Record<string, any>
  ) => {
    const metric = activeOperations.current.get(operationId);
    if (!metric) return;

    const endTime = performance.now();
    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration: endTime - metric.startTime,
      success,
      error,
      metadata: { ...metric.metadata, ...additionalMetadata }
    };

    activeOperations.current.delete(operationId);
    
    setMetrics(prev => {
      const updated = [...prev, completedMetric];
      // Keep only last 100 metrics to prevent memory issues
      return updated.slice(-100);
    });

    // Log performance warnings
    if (completedMetric.duration && completedMetric.duration > 5000) {
      console.warn(`Slow operation detected: ${metric.operation} took ${completedMetric.duration.toFixed(2)}ms`);
    }

    if (!success && error) {
      console.error(`Operation failed: ${metric.operation} - ${error}`);
    }
  }, []);

  const getStats = useCallback((): PerformanceStats => {
    const recentMetrics = metrics.slice(-50); // Last 50 operations
    const totalOperations = recentMetrics.length;
    
    if (totalOperations === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        errorRate: 0,
        operationsByType: {},
        recentErrors: []
      };
    }

    const successfulOps = recentMetrics.filter(m => m.success).length;
    const failedOps = recentMetrics.filter(m => !m.success).length;
    const durations = recentMetrics.filter(m => m.duration).map(m => m.duration!);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const operationsByType = recentMetrics.reduce((acc, metric) => {
      acc[metric.operation] = (acc[metric.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = recentMetrics
      .filter(m => !m.success && m.error)
      .slice(-10)
      .map(m => m.error!)
      .filter((error, index, arr) => arr.indexOf(error) === index); // Unique errors only

    return {
      totalOperations,
      averageDuration,
      successRate: (successfulOps / totalOperations) * 100,
      errorRate: (failedOps / totalOperations) * 100,
      operationsByType,
      recentErrors
    };
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    activeOperations.current.clear();
  }, []);

  const enableMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const disableMonitoring = useCallback(() => {
    setIsMonitoring(false);
    clearMetrics();
  }, [clearMetrics]);

  // Convenience wrapper for automatic monitoring
  const monitorOperation = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    if (!isMonitoring) {
      return fn();
    }

    const operationId = startOperation(operation, metadata);
    
    try {
      const result = await fn();
      endOperation(operationId, true, undefined, { result: 'success' });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      endOperation(operationId, false, errorMessage);
      throw error;
    }
  }, [isMonitoring, startOperation, endOperation]);

  return {
    startOperation,
    endOperation,
    monitorOperation,
    getStats,
    clearMetrics,
    enableMonitoring,
    disableMonitoring,
    isMonitoring,
    metrics: metrics.slice(-20), // Return only recent metrics for display
    activeOperationsCount: activeOperations.current.size
  };
};
