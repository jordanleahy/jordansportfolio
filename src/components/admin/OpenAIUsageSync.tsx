import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAIUsageSyncLog } from '@/types/apiUsage';
import { formatCurrency } from '@/lib/utils';

export const OpenAIUsageSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncType, setSyncType] = useState('daily');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sync logs - temporarily disabled until migration is executed
  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['openai-sync-logs'],
    queryFn: async () => {
      // Return empty array until migration is executed
      return [] as OpenAIUsageSyncLog[];
    },
  });

  // Get sync status summary - temporarily disabled until migration is executed
  const { data: syncSummary } = useQuery({
    queryKey: ['sync-summary'],
    queryFn: async () => {
      // Return mock data until migration is executed
      return {
        syncedCount: 0,
        pendingCount: 0,
        totalActualCost: 0,
        totalEstimatedCost: 0,
        variance: 0,
        totalRecords: 0,
      };
    },
  });

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-openai-usage', {
        body: { 
          syncType,
          date: new Date().toISOString().split('T')[0] 
        },
      });

      if (error) throw error;

      toast({
        title: 'Sync Completed',
        description: `Successfully synced ${data.records_synced} records. Cost: ${formatCurrency(data.total_cost_synced)}`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['openai-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-summary'] });
      queryClient.invalidateQueries({ queryKey: ['api-usage'] });

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial_success':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'partial_success':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            OpenAI Usage Sync
          </CardTitle>
          <CardDescription>
            Synchronize usage data with OpenAI's official usage API to get accurate costs and user attribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={syncType} onValueChange={setSyncType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSync} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Summary */}
      {syncSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Synced Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {syncSummary.syncedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {syncSummary.totalRecords} total records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {syncSummary.pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Records waiting for sync
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(syncSummary.totalActualCost)}
              </div>
              <p className="text-xs text-muted-foreground">
                From OpenAI API
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cost Variance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${syncSummary.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {syncSummary.variance >= 0 ? '+' : ''}{formatCurrency(syncSummary.variance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Actual vs estimated
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Sync Operations
          </CardTitle>
          <CardDescription>
            History of OpenAI usage synchronization attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : !syncLogs || syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync operations yet. Click "Sync Now" to start.
            </div>
          ) : (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.sync_status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.sync_date}</span>
                        <Badge variant="secondary" className={getStatusColor(log.sync_status)}>
                          {log.sync_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.records_synced} records • {formatCurrency(log.total_cost_synced)} • {log.sync_type}
                      </div>
                      {log.error_details && (
                        <div className="text-xs text-red-600 mt-1">
                          {log.error_details.errors?.[0] || 'Sync had errors'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};