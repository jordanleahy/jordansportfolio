import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Database, Zap, Clock } from 'lucide-react';
import { useCachedPromptGeneration } from '@/hooks/useCachedPromptGeneration';
import { cacheManager } from '@/lib/cacheManager';

export const CacheMonitor: React.FC = () => {
  const { getCacheStats } = useCachedPromptGeneration();
  const [stats, setStats] = React.useState(getCacheStats());
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  const refreshStats = () => {
    setStats(getCacheStats());
    setLastUpdated(new Date());
  };

  const clearAllCaches = () => {
    cacheManager.clearAllCaches();
    refreshStats();
  };

  React.useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatHitRate = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cache Performance Monitor
            </CardTitle>
            <CardDescription>
              Real-time cache statistics and performance metrics
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshStats}>
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAllCaches}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Cache */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Prompt Cache</p>
              <p className="text-sm text-muted-foreground">Generated image prompts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-mono">{stats.prompts.size}/{stats.prompts.maxSize}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
              <Zap className="h-3 w-3 mr-1" />
              {formatHitRate(stats.prompts.hitRate)}
            </Badge>
          </div>
        </div>

        {/* System Prompt Cache */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">System Prompts</p>
              <p className="text-sm text-muted-foreground">Cached system prompts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-mono">{stats.systemPrompts.size}/{stats.systemPrompts.maxSize}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-700">
              Active
            </Badge>
          </div>
        </div>

        {/* Theme Cache */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Theme Data</p>
              <p className="text-sm text-muted-foreground">Cached theme information</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-mono">{stats.themes.size}/{stats.themes.maxSize}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700">
              Active
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <span>Auto-refresh every 5s</span>
        </div>
      </CardContent>
    </Card>
  );
};