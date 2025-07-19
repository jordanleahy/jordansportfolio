
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { iconMap, type IconName } from '@/utils/iconMap';
import { parsePerformanceMetrics, type FormattedMetric } from '@/utils/metricsFormatter';

interface PerformanceMetricsProps {
  metrics: any;
}

const MetricCard: React.FC<{ metric: FormattedMetric }> = ({ metric }) => {
  const IconComponent = iconMap[metric.icon as IconName] || iconMap.Activity;
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-4 w-4 ${metric.color}`} />
          <span className="text-sm font-medium text-muted-foreground">
            {metric.label}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {metric.type}
        </Badge>
      </div>
      <div className={`text-xl sm:text-2xl font-bold ${metric.color}`}>
        {metric.value}
      </div>
    </div>
  );
};

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const formattedMetrics = parsePerformanceMetrics(metrics);
  
  if (formattedMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <iconMap.BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance metrics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Group metrics by type for better organization
  const groupedMetrics = formattedMetrics.reduce((acc, metric) => {
    if (!acc[metric.type]) acc[metric.type] = [];
    acc[metric.type].push(metric);
    return acc;
  }, {} as Record<string, FormattedMetric[]>);
  
  // Order of metric types for display
  const typeOrder: FormattedMetric['type'][] = ['financial', 'volume', 'count', 'percentage', 'text'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {typeOrder.map(type => {
          const metricsOfType = groupedMetrics[type];
          if (!metricsOfType || metricsOfType.length === 0) return null;
          
          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  {type === 'financial' ? 'Financial' : 
                   type === 'volume' ? 'Volume' :
                   type === 'count' ? 'Metrics' :
                   type === 'percentage' ? 'Rates' : 'Other'}
                </h4>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricsOfType.map((metric, idx) => (
                  <MetricCard key={`${type}-${idx}`} metric={metric} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
