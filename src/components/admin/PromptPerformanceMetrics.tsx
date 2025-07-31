import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react';

export const PromptPerformanceMetrics = () => {
  // Mock data - in real implementation, this would come from API usage tracking
  const mockMetrics = {
    totalPrompts: 12,
    avgSuccessRate: 89.3,
    avgResponseTime: 1247,
    topPerformingCategories: [
      { category: 'healthcare', successRate: 94.2, usageCount: 156 },
      { category: 'cdi', successRate: 91.8, usageCount: 89 },
      { category: 'contracts', successRate: 87.5, usageCount: 67 },
      { category: 'design', successRate: 85.1, usageCount: 45 }
    ],
    recentTrends: {
      successRateChange: +5.3,
      responseTimeChange: -12.4,
      usageChange: +28.7
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Prompt Performance Overview
        </CardTitle>
        <CardDescription>
          Real-time analytics on system prompt effectiveness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">{mockMetrics.avgSuccessRate}%</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+{mockMetrics.recentTrends.successRateChange}%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <div className="text-2xl font-bold">{mockMetrics.avgResponseTime}ms</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
              <span className="text-green-600">{mockMetrics.recentTrends.responseTimeChange}%</span>
              <span className="text-muted-foreground">faster</span>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Category Performance</h4>
          <div className="space-y-3">
            {mockMetrics.topPerformingCategories.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {category.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {category.usageCount} uses
                    </span>
                  </div>
                  <span className="text-sm font-medium">{category.successRate}%</span>
                </div>
                <Progress value={category.successRate} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Usage Trends */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monthly Usage Growth</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                +{mockMetrics.recentTrends.usageChange}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};