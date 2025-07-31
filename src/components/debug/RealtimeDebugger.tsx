import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  Wifi, 
  WifiOff,
  Clock,
  Database,
  Zap,
  AlertTriangle,
  Info,
  Bug
} from 'lucide-react';
import type { RealtimeLogEntry, RealtimeMetrics } from '@/hooks/useRealtimePosts';

interface RealtimeDebuggerProps {
  isConnected: boolean;
  logs: RealtimeLogEntry[];
  metrics: RealtimeMetrics;
  sessionId: string;
  onClearLogs: () => void;
  onExportLogs: () => any;
  realtimeUpdates: any[];
}

export const RealtimeDebugger: React.FC<RealtimeDebuggerProps> = ({
  isConnected,
  logs,
  metrics,
  sessionId,
  onClearLogs,
  onExportLogs,
  realtimeUpdates,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('ALL');

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + String(timestamp % 1000).padStart(3, '0');
  };

  const getLevelIcon = (level: RealtimeLogEntry['level']) => {
    switch (level) {
      case 'ERROR': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'DEBUG': return <Bug className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: RealtimeLogEntry['category']) => {
    switch (category) {
      case 'Connection': return <Wifi className="h-4 w-4" />;
      case 'Update': return <Activity className="h-4 w-4" />;
      case 'Cache': return <Database className="h-4 w-4" />;
      case 'Performance': return <Zap className="h-4 w-4" />;
      case 'Error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    selectedLogLevel === 'ALL' || log.level === selectedLogLevel
  );

  const handleExportLogs = () => {
    const exportData = onExportLogs();
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `realtime-logs-${sessionId}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg bg-background/95 backdrop-blur"
        >
          <Activity className="h-4 w-4 mr-2" />
          Realtime Debug
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
            {isConnected ? 'LIVE' : 'OFF'}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh]">
      <Card className="shadow-xl bg-background/95 backdrop-blur border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
              <CardTitle className="text-lg">Realtime Debug</CardTitle>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </Badge>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Session: {sessionId} • {logs.length} logs • {realtimeUpdates.length} updates
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Connection</div>
                  <div className="font-mono">
                    {metrics.successfulConnections}/{metrics.connectionAttempts}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Updates</div>
                  <div className="font-mono">
                    {metrics.totalUpdatesProcessed}/{metrics.totalUpdatesReceived}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Cache Hits</div>
                  <div className="font-mono">{metrics.totalCacheInvalidations}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Debounces</div>
                  <div className="font-mono">{metrics.debounceHits}</div>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <div className="text-muted-foreground">Avg Processing</div>
                  <div className="font-mono">{metrics.averageProcessingTime?.toFixed(2) || 0}ms</div>
                </div>
              </div>
              
              {metrics.lastUpdateTimestamp && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">Last Update</div>
                  <div className="text-sm font-mono">
                    {formatTimestamp(metrics.lastUpdateTimestamp)}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs" className="p-0">
              <div className="p-4 border-b space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select 
                      value={selectedLogLevel}
                      onChange={(e) => setSelectedLogLevel(e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="ALL">All Levels</option>
                      <option value="ERROR">Errors</option>
                      <option value="WARN">Warnings</option>
                      <option value="INFO">Info</option>
                      <option value="DEBUG">Debug</option>
                    </select>
                    <Badge variant="outline" className="text-xs">
                      {filteredLogs.length}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button onClick={onClearLogs} variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button onClick={handleExportLogs} variant="ghost" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {filteredLogs.slice(-50).reverse().map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          {getCategoryIcon(log.category)}
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.category}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                      <div className="font-medium mb-1">{log.message}</div>
                      {log.data && (
                        <details className="text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            View Data
                          </summary>
                          <pre className="mt-1 text-xs overflow-x-auto bg-background p-2 rounded">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                  
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs found for selected level
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="updates" className="p-0">
              <ScrollArea className="h-64">
                <div className="p-2 space-y-2">
                  {realtimeUpdates.slice(-20).reverse().map((update, index) => (
                    <div key={index} className="text-xs p-2 rounded border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="default" className="text-xs">
                          {update.category}
                        </Badge>
                        <div className="text-muted-foreground font-mono text-xs">
                          {update.postId?.slice(0, 8)}...
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {Object.entries(update.imageStatuses || {}).map(([aspect, status]) => (
                          <div key={aspect} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {aspect.replace('image_', '').replace('_status', '')}:
                            </span>
                            <Badge 
                              variant={String(status) === 'complete' ? 'default' : 'outline'} 
                              className="text-xs px-1 py-0"
                            >
                              {String(status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {realtimeUpdates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No realtime updates yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};