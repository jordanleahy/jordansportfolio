import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { checkSystemPromptHealth, recoverAllMissingSystemPrompts } from '@/utils/systemPromptRecovery';

interface SystemPromptStats {
  total: number;
  completed: number;
  generating: number;
  failed: number;
  notStarted: number;
  withSystemPrompt: number;
  missingSystemPrompt: number;
}

const SystemPromptMonitor = () => {
  const [stats, setStats] = useState<SystemPromptStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const result = await checkSystemPromptHealth();
      setStats(result.stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system prompt stats:', error);
      toast.error('Failed to load system prompt health data');
    } finally {
      setIsLoading(false);
    }
  };

  const runRecovery = async () => {
    setIsRecovering(true);
    try {
      toast.info('Starting system prompt recovery...');
      const result = await recoverAllMissingSystemPrompts();
      
      if (result.successful > 0) {
        toast.success(`Recovery completed: ${result.successful} themes recovered, ${result.failed} failed`);
      } else if (result.totalProcessed === 0) {
        toast.info('No themes needed system prompt recovery');
      } else {
        toast.warning(`Recovery completed with issues: ${result.failed} themes failed`);
      }
      
      // Refresh stats after recovery
      await fetchStats();
    } catch (error) {
      console.error('Recovery failed:', error);
      toast.error('System prompt recovery failed');
    } finally {
      setIsRecovering(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getHealthColor = () => {
    if (!stats) return 'bg-gray-500';
    const healthRatio = stats.completed / (stats.total || 1);
    if (healthRatio >= 0.9) return 'bg-green-500';
    if (healthRatio >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthText = () => {
    if (!stats) return 'Unknown';
    const healthRatio = stats.completed / (stats.total || 1);
    if (healthRatio >= 0.9) return 'Healthy';
    if (healthRatio >= 0.7) return 'Warning';
    return 'Critical';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              System Prompt Health
              <div className={`w-3 h-3 rounded-full ${getHealthColor()}`} />
            </CardTitle>
            <CardDescription>
              Monitor and manage system prompt generation across themes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={runRecovery}
              disabled={isRecovering || !stats?.failed}
            >
              {isRecovering ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Recover Failed
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading stats...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overall Health */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-medium">Overall Health</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completed} of {stats.total} themes have system prompts
                </p>
              </div>
              <Badge variant="secondary" className={`${getHealthColor()} text-white`}>
                {getHealthText()}
              </Badge>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Completed</p>
                  <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Generating</p>
                  <p className="text-lg font-bold text-blue-600">{stats.generating}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Failed</p>
                  <p className="text-lg font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Not Started</p>
                  <p className="text-lg font-bold text-gray-600">{stats.notStarted}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Prompt Coverage</span>
                <span>{Math.round((stats.completed / (stats.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getHealthColor()}`}
                  style={{ width: `${(stats.completed / (stats.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-center">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Failed to load system prompt health data
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemPromptMonitor;