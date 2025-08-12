import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

export const PerformanceDashboard: React.FC = () => {
  const { getStats, isMonitoring, enableMonitoring, disableMonitoring, metrics, activeOperationsCount } = usePerformanceMonitor();
  
  const stats = getStats();

  if (!isMonitoring) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Performance monitoring is disabled. Enable it to track image generation performance.
          </p>
          <button 
            onClick={enableMonitoring}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Enable Monitoring
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Monitor
        </h3>
        <button 
          onClick={disableMonitoring}
          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          Disable
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageDuration ? `${(stats.averageDuration / 1000).toFixed(1)}s` : '0s'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successRate.toFixed(1)}%
            </div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.errorRate.toFixed(1)}%
            </div>
            <Progress value={stats.errorRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeOperationsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Operations by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.operationsByType).map(([operation, count]) => (
              <div key={operation} className="flex items-center justify-between">
                <span className="text-sm font-medium">{operation}</span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {stats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.slice(-5).map((metric, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="font-medium">{metric.operation}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {metric.duration ? `${(metric.duration / 1000).toFixed(1)}s` : 'Running...'}
                  </span>
                  {metric.success === false && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                  {metric.success === true && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};