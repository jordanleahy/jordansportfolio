import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import type { PipelineProgressModalProps } from '@/types/stories/ui';

export const PipelineProgressModal: React.FC<PipelineProgressModalProps> = ({
  open,
  onOpenChange,
  progress,
  currentStage,
  isProcessing,
  error,
  result
}) => {
  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="h-6 w-6 text-destructive" />;
    }
    if (result && !isProcessing) {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    }
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  };

  const getStatusColor = () => {
    if (error) return 'text-destructive';
    if (result && !isProcessing) return 'text-green-600';
    return 'text-primary';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              {error ? 'Generation Failed' : result ? 'Generation Complete!' : 'Generating Theme...'}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          {!error && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% Complete
              </p>
            </div>
          )}

          {/* Current Stage */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Status:</p>
            <p className="text-sm text-muted-foreground">
              {error || currentStage}
            </p>
          </div>

          {/* Result Summary */}
          {result && (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">
                Success! Created "{result.theme}"
              </p>
              <p className="text-sm text-green-600">
                • {result.postCount} posts generated
                • Theme image created
                • Category: {result.category}
              </p>
            </div>
          )}

          {/* Error Details */}
          {error && (
            <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              variant={error ? "destructive" : result ? "default" : "outline"}
              disabled={isProcessing}
            >
              {error ? 'Close' : result ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};