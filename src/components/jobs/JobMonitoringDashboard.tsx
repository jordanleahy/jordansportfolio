import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import { jobMonitoringService } from '@/services/jobMonitoringService';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import type { JobTarget, JobMonitoringConfig, JobMonitoringState } from '@/types/jobMonitoring';

interface JobMonitoringDashboardProps {
  user: User;
}

export const JobMonitoringDashboard: React.FC<JobMonitoringDashboardProps> = ({ user }) => {
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [config, setConfig] = useState<JobMonitoringConfig | null>(null);
  const [states, setStates] = useState<JobMonitoringState[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [targetsData, configData, statesData] = await Promise.all([
        jobMonitoringService.getJobTargets(),
        jobMonitoringService.getMonitoringConfig(user.id),
        jobMonitoringService.getMonitoringStates()
      ]);

      setTargets(targetsData);
      setConfig(configData);
      setStates(statesData);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    setMonitoring(true);
    try {
      const result = await jobMonitoringService.triggerMonitoring();
      
      if (result.success) {
        toast({
          title: 'Monitoring Started',
          description: result.message
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to start monitoring',
        variant: 'destructive'
      });
    } finally {
      setMonitoring(false);
    }
  };

  const handleToggleTarget = async (targetId: string, isActive: boolean) => {
    try {
      await jobMonitoringService.updateJobTarget(targetId, { is_active: isActive });
      setTargets(prev => 
        prev.map(target => 
          target.id === targetId ? { ...target, is_active: isActive } : target
        )
      );
      
      toast({
        title: 'Updated',
        description: `Target ${isActive ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        title: 'Error',
        description: 'Failed to update target',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateConfig = async (updates: Partial<JobMonitoringConfig>) => {
    try {
      const updatedConfig = await jobMonitoringService.updateMonitoringConfig({
        ...config,
        ...updates,
        user_id: user.id
      });
      
      setConfig(updatedConfig);
      
      toast({
        title: 'Updated',
        description: 'Monitoring configuration updated'
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeTargets = targets.filter(t => t.is_active).length;
  const totalTargets = targets.length;
  const lastMonitoring = states.length > 0 
    ? new Date(Math.max(...states.map(s => s.last_scraped_at ? new Date(s.last_scraped_at).getTime() : 0)))
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Targets</p>
                <p className="text-2xl font-bold">{activeTargets}/{totalTargets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Poll Interval</p>
                <p className="text-2xl font-bold">{config?.poll_interval_minutes || 10}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">{states.filter(s => s.error_count > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Last Run</p>
                <p className="text-sm font-medium">
                  {lastMonitoring ? lastMonitoring.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartMonitoring}
          disabled={monitoring || activeTargets === 0}
          size="lg"
          className="px-8"
        >
          {monitoring ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Monitoring...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Monitoring
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="targets">Job Targets</TabsTrigger>
          <TabsTrigger value="status">Monitoring Status</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ATS Career Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targets.map(target => (
                  <div key={target.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{target.name}</h4>
                        <Badge variant="outline">{target.ats_platform}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{target.url}</p>
                    </div>
                    <Switch
                      checked={target.is_active}
                      onCheckedChange={(checked) => handleToggleTarget(target.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {states.map((state, index) => {
                  const target = targets.find(t => t.id === state.target_id);
                  if (!target) return null;

                  return (
                    <div key={state.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{target.name}</h4>
                          {state.error_count > 0 ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge variant="default">Success</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <p>Last scraped: {state.last_scraped_at ? new Date(state.last_scraped_at).toLocaleString() : 'Never'}</p>
                          <p>Jobs found: {state.last_job_count}</p>
                          {state.last_error && (
                            <p className="text-red-600">Error: {state.last_error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Monitoring Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title-regex">Title Filter (Regex)</Label>
                  <Input
                    id="title-regex"
                    value={config?.title_regex || ''}
                    onChange={(e) => handleUpdateConfig({ title_regex: e.target.value })}
                    placeholder="(?i)product\s+designer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poll-interval">Poll Interval (minutes)</Label>
                  <Input
                    id="poll-interval"
                    type="number"
                    min="5"
                    max="60"
                    value={config?.poll_interval_minutes || 10}
                    onChange={(e) => handleUpdateConfig({ poll_interval_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new jobs are found</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={config?.notifications_enabled || false}
                    onCheckedChange={(checked) => handleUpdateConfig({ notifications_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for new jobs</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={config?.email_notifications || false}
                    onCheckedChange={(checked) => handleUpdateConfig({ email_notifications: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL (optional)</Label>
                <Input
                  id="webhook-url"
                  value={config?.webhook_url || ''}
                  onChange={(e) => handleUpdateConfig({ webhook_url: e.target.value })}
                  placeholder="https://your-webhook.com/endpoint"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};