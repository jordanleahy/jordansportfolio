import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, X } from 'lucide-react';

interface SimplifiedBatchSkeletonProps {
  isVisible: boolean;
  completionProgress: {
    total: number;
    completed: number;
    isComplete: boolean;
  };
  className?: string;
  onDismiss?: () => void;
}

export const SimplifiedBatchSkeleton: React.FC<SimplifiedBatchSkeletonProps> = ({
  isVisible,
  completionProgress,
  className = '',
  onDismiss
}) => {
  if (!isVisible) return null;

  const { total, completed, isComplete } = completionProgress;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className={`w-full border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {isComplete ? 'Finalizing theme...' : 'Generating posts...'}
            </span>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Simplified progress indicator */}
        {total > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress: {completed}/{total} posts</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Single shimmer placeholder */}
        <div className="relative overflow-hidden rounded-md">
          <Skeleton className="w-full h-20 animate-pulse" />
          
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
        </div>

        {/* Status message */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            {total === 0 && 'Preparing posts...'}
            {total > 0 && completed === 0 && 'Starting post generation...'}
            {total > 0 && completed > 0 && completed < total && 
              `Generated ${completed} of ${total} posts`}
            {isComplete && 'All posts ready, finalizing...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};