import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, Activity } from 'lucide-react';
import { useTimeOnTask } from '@/hooks/useTimeOnTask';

export const TimeOnTaskTimer: React.FC = () => {
  const {
    currentSessionTime,
    totalTime,
    sessionCount,
    isActive,
    formatTime,
    getAverageSessionTime,
    resetData
  } = useTimeOnTask();

  return (
    <Card className="border border-muted-foreground/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Time on Task
          {isActive && (
            <div className="flex items-center ml-2">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-sm text-green-500 ml-1">Active</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(currentSessionTime)}
            </div>
            <div className="text-sm text-muted-foreground">Current Session</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(totalTime)}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {sessionCount}
            </div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
        </div>
        
        {sessionCount > 0 && (
          <div className="pt-2 border-t border-muted-foreground/10">
            <div className="text-center">
              <div className="text-lg font-mono text-muted-foreground">
                {formatTime(getAverageSessionTime())}
              </div>
              <div className="text-xs text-muted-foreground">Average per session</div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetData}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground/70 text-center">
          Data stored locally in your browser
        </div>
      </CardContent>
    </Card>
  );
};