import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Lightbulb, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export const FinetuningInsights = () => {
  // Mock insights - in real implementation, this would be AI-generated based on performance data
  const insights = [
    {
      type: 'optimization',
      priority: 'high',
      title: 'Healthcare prompts performing exceptionally',
      description: 'Healthcare category shows 94.2% success rate. Consider using similar patterns for other categories.',
      action: 'Analyze healthcare prompt structure',
      icon: CheckCircle,
      color: 'green'
    },
    {
      type: 'warning',
      priority: 'medium',
      title: 'Design prompts need attention',
      description: 'Design category success rate (85.1%) is below average. Response time also higher than optimal.',
      action: 'Review and optimize design prompts',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      type: 'suggestion',
      priority: 'low',
      title: 'Seed correlation opportunity',
      description: 'CDI seeds show strong correlation with healthcare prompts. Consider cross-pollination.',
      action: 'Test cross-category patterns',
      icon: Lightbulb,
      color: 'blue'
    }
  ];

  const recommendations = [
    {
      category: 'Prompt Length',
      current: 'Avg 2,400 chars',
      optimal: '1,800-2,200 chars',
      impact: 'Medium',
      suggestion: 'Reduce verbosity in design prompts'
    },
    {
      category: 'Response Caching',
      current: '23% cache hit rate',
      optimal: '40-60%',
      impact: 'High',
      suggestion: 'Implement smarter caching for similar prompts'
    },
    {
      category: 'Category Balance',
      current: '4 active categories',
      optimal: '6-8 categories',
      impact: 'Low',
      suggestion: 'Add specialized prompts for edge cases'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
      case 'blue': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Fine-tuning Insights
        </CardTitle>
        <CardDescription>
          Intelligent recommendations to optimize your system prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Insights */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Smart Insights</h4>
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <Alert key={index} className="border-l-4 border-l-primary/20">
                <IconComponent className={`h-4 w-4 ${getIconColor(insight.color)}`} />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{insight.title}</span>
                      <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <Button variant="outline" size="sm" className="text-xs">
                      {insight.action}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>

        {/* Optimization Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Optimization Opportunities</h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{rec.category}</span>
                  <Badge 
                    variant={rec.impact === 'High' ? 'default' : rec.impact === 'Medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {rec.impact} Impact
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Current: </span>
                    <span>{rec.current}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Optimal: </span>
                    <span>{rec.optimal}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Score */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Overall Optimization Score</span>
              <p className="text-xs text-muted-foreground">Based on performance analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">87</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};