import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  // Generation metrics
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  cacheHitRate: number;
  
  // Resource metrics
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
  
  // Quality metrics
  userSatisfactionScore: number;
  retryRate: number;
  
  // System health
  systemLoad: number;
  backgroundTasksActive: number;
}

interface BottleneckDetection {
  type: 'network' | 'cache' | 'generation' | 'storage' | 'processing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  detectedAt: number;
  metrics: Record<string, number>;
}

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'capacity' | 'quality';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  resolved: boolean;
  actionRequired?: string;
}

export const useComprehensiveMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    averageGenerationTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorRate: 0,
    userSatisfactionScore: 0,
    retryRate: 0,
    systemLoad: 0,
    backgroundTasksActive: 0
  });

  const [bottlenecks, setBottlenecks] = useState<BottleneckDetection[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance tracking
  const performanceLog = useRef<Array<{
    timestamp: number;
    operation: string;
    duration: number;
    success: boolean;
    metadata?: Record<string, any>;
  }>>([]);

  const thresholds = {
    generationTime: 15000, // 15 seconds
    errorRate: 0.05, // 5%
    cacheHitRate: 0.8, // 80%
    networkLatency: 2000, // 2 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    retryRate: 0.1 // 10%
  };

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Start periodic metrics collection
    const interval = setInterval(() => {
      collectSystemMetrics();
      detectBottlenecks();
      analyzePerformanceTrends();
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const trackOperation = useCallback((
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ) => {
    const logEntry = {
      timestamp: Date.now(),
      operation,
      duration,
      success,
      metadata
    };

    performanceLog.current.push(logEntry);
    
    // Keep only last 1000 entries
    if (performanceLog.current.length > 1000) {
      performanceLog.current = performanceLog.current.slice(-1000);
    }

    // Update real-time metrics
    updateMetrics(logEntry);
    
    // Check for immediate issues
    if (duration > thresholds.generationTime) {
      addAlert({
        type: 'performance',
        message: `Slow operation detected: ${operation} took ${duration}ms`,
        severity: 'warning'
      });
    }

    if (!success) {
      addAlert({
        type: 'error',
        message: `Operation failed: ${operation}`,
        severity: 'error'
      });
    }
  }, []);

  const updateMetrics = useCallback((logEntry: any) => {
    setMetrics(prev => {
      const recentLogs = performanceLog.current.filter(
        log => Date.now() - log.timestamp < 300000 // Last 5 minutes
      );

      const totalOps = recentLogs.length;
      const successfulOps = recentLogs.filter(log => log.success).length;
      const avgTime = totalOps > 0 ? 
        recentLogs.reduce((sum, log) => sum + log.duration, 0) / totalOps : 0;

      return {
        ...prev,
        totalGenerations: prev.totalGenerations + (logEntry.operation.includes('generation') ? 1 : 0),
        successfulGenerations: prev.successfulGenerations + 
          (logEntry.operation.includes('generation') && logEntry.success ? 1 : 0),
        failedGenerations: prev.failedGenerations + 
          (logEntry.operation.includes('generation') && !logEntry.success ? 1 : 0),
        averageGenerationTime: avgTime,
        errorRate: totalOps > 0 ? (totalOps - successfulOps) / totalOps : 0,
        cacheHitRate: logEntry.metadata?.cacheHit ? 
          (prev.cacheHitRate * 0.9 + 0.1) : (prev.cacheHitRate * 0.9)
      };
    });
  }, []);

  const collectSystemMetrics = useCallback(async () => {
    try {
      // Collect browser memory usage
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;

      // Measure network latency with a simple ping to Supabase
      const pingStart = Date.now();
      await supabase.from('social_media_posts').select('id').limit(1);
      const networkLatency = Date.now() - pingStart;

      // Estimate system load based on recent performance
      const recentLogs = performanceLog.current.filter(
        log => Date.now() - log.timestamp < 60000 // Last minute
      );
      const systemLoad = recentLogs.length / 60; // Operations per second

      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        networkLatency,
        systemLoad
      }));

    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }, []);

  const detectBottlenecks = useCallback(() => {
    const newBottlenecks: BottleneckDetection[] = [];
    const currentMetrics = metrics;

    // Network bottleneck detection
    if (currentMetrics.networkLatency > thresholds.networkLatency) {
      newBottlenecks.push({
        type: 'network',
        severity: currentMetrics.networkLatency > thresholds.networkLatency * 2 ? 'high' : 'medium',
        description: `High network latency detected: ${currentMetrics.networkLatency}ms`,
        recommendation: 'Check network connection or server status',
        detectedAt: Date.now(),
        metrics: { latency: currentMetrics.networkLatency }
      });
    }

    // Cache performance bottleneck
    if (currentMetrics.cacheHitRate < thresholds.cacheHitRate) {
      newBottlenecks.push({
        type: 'cache',
        severity: currentMetrics.cacheHitRate < 0.5 ? 'high' : 'medium',
        description: `Low cache hit rate: ${(currentMetrics.cacheHitRate * 100).toFixed(1)}%`,
        recommendation: 'Optimize caching strategy or increase cache size',
        detectedAt: Date.now(),
        metrics: { hitRate: currentMetrics.cacheHitRate }
      });
    }

    // Generation performance bottleneck
    if (currentMetrics.averageGenerationTime > thresholds.generationTime) {
      newBottlenecks.push({
        type: 'generation',
        severity: currentMetrics.averageGenerationTime > thresholds.generationTime * 2 ? 'high' : 'medium',
        description: `Slow generation times: ${(currentMetrics.averageGenerationTime / 1000).toFixed(1)}s average`,
        recommendation: 'Optimize AI model usage or implement progressive loading',
        detectedAt: Date.now(),
        metrics: { avgTime: currentMetrics.averageGenerationTime }
      });
    }

    // Error rate bottleneck
    if (currentMetrics.errorRate > thresholds.errorRate) {
      newBottlenecks.push({
        type: 'processing',
        severity: currentMetrics.errorRate > 0.15 ? 'critical' : 'high',
        description: `High error rate: ${(currentMetrics.errorRate * 100).toFixed(1)}%`,
        recommendation: 'Investigate error causes and implement retry mechanisms',
        detectedAt: Date.now(),
        metrics: { errorRate: currentMetrics.errorRate }
      });
    }

    setBottlenecks(newBottlenecks);
  }, [metrics, thresholds]);

  const analyzePerformanceTrends = useCallback(() => {
    const recentLogs = performanceLog.current.filter(
      log => Date.now() - log.timestamp < 900000 // Last 15 minutes
    );

    if (recentLogs.length < 10) return; // Need sufficient data

    // Analyze trends over time
    const timeSlices = 5;
    const sliceSize = recentLogs.length / timeSlices;
    const trends = [];

    for (let i = 0; i < timeSlices; i++) {
      const slice = recentLogs.slice(i * sliceSize, (i + 1) * sliceSize);
      const avgTime = slice.reduce((sum, log) => sum + log.duration, 0) / slice.length;
      const successRate = slice.filter(log => log.success).length / slice.length;
      
      trends.push({ avgTime, successRate });
    }

    // Detect degrading performance
    const avgTimeIncrease = trends[trends.length - 1].avgTime / trends[0].avgTime;
    const successRateDecrease = trends[0].successRate / trends[trends.length - 1].successRate;

    if (avgTimeIncrease > 1.5) {
      addAlert({
        type: 'performance',
        message: 'Performance degradation detected - response times increasing',
        severity: 'warning',
        actionRequired: 'Review system resources and optimize bottlenecks'
      });
    }

    if (successRateDecrease > 1.2) {
      addAlert({
        type: 'quality',
        message: 'Quality degradation detected - success rate decreasing',
        severity: 'error',
        actionRequired: 'Investigate error causes and implement fixes'
      });
    }
  }, []);

  const addAlert = useCallback((alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) => {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  }, []);

  const getPerformanceReport = useCallback(() => {
    const recentLogs = performanceLog.current.filter(
      log => Date.now() - log.timestamp < 3600000 // Last hour
    );

    const generationOps = recentLogs.filter(log => log.operation.includes('generation'));
    const cacheOps = recentLogs.filter(log => log.operation.includes('cache'));

    return {
      summary: {
        totalOperations: recentLogs.length,
        averageResponseTime: recentLogs.length > 0 ? 
          recentLogs.reduce((sum, log) => sum + log.duration, 0) / recentLogs.length : 0,
        successRate: recentLogs.length > 0 ? 
          recentLogs.filter(log => log.success).length / recentLogs.length : 0
      },
      generations: {
        count: generationOps.length,
        averageTime: generationOps.length > 0 ? 
          generationOps.reduce((sum, log) => sum + log.duration, 0) / generationOps.length : 0,
        successRate: generationOps.length > 0 ? 
          generationOps.filter(log => log.success).length / generationOps.length : 0
      },
      cache: {
        operations: cacheOps.length,
        hitRate: cacheOps.length > 0 ? 
          cacheOps.filter(log => log.metadata?.cacheHit).length / cacheOps.length : 0
      },
      bottlenecks: bottlenecks.length,
      criticalAlerts: alerts.filter(alert => !alert.resolved && alert.severity === 'critical').length
    };
  }, [bottlenecks, alerts]);

  // Auto-start monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    bottlenecks,
    alerts,
    isMonitoring,
    trackOperation,
    resolveAlert,
    getPerformanceReport,
    startMonitoring
  };
};
