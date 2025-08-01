import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

interface BatchProcessingSkeletonProps {
  isGenerating: boolean;
  progress: {
    completed: number;
    total: number;
    currentAspectRatio?: string;
    isProcessing?: boolean;
    isFinalizing?: boolean;
  };
  className?: string;
}

export const BatchProcessingSkeleton: React.FC<BatchProcessingSkeletonProps> = ({
  isGenerating,
  progress,
  className = ''
}) => {
  if (!isGenerating) return null;

  const aspectRatios = [
    { ratio: '16:9', label: 'Landscape', className: 'aspect-video' },
    { ratio: '9:16', label: 'Portrait', className: 'aspect-[9/16]' },
    { ratio: '4:3', label: 'Standard', className: 'aspect-[4/3]' },
    { ratio: '3:4', label: 'Social', className: 'aspect-[3/4]' },
  ];

  return (
    <Card className={`w-full border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {progress.isFinalizing 
                ? 'Finalizing all images...' 
                : 'Generating all images...'
              }
            </span>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress: {progress.completed}/{progress.total}</span>
            {progress.currentAspectRatio && (
              <span>Current: {progress.currentAspectRatio}</span>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Skeleton placeholders for all aspect ratios */}
        <div className="grid grid-cols-2 gap-3">
          {aspectRatios.map(({ ratio, label, className: aspectClass }, index) => {
            const isCompleted = index < progress.completed && !progress.isFinalizing;
            const isCurrent = progress.currentAspectRatio === ratio;
            const showShimmer = isCurrent || progress.isFinalizing;

            return (
              <div 
                key={ratio} 
                className={`relative transition-all duration-300 ${
                  isCompleted ? 'opacity-60' : (isCurrent || progress.isFinalizing) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {label} ({ratio})
                    </span>
                    {isCompleted && !progress.isFinalizing && (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                    {(isCurrent || progress.isFinalizing) && (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    )}
                  </div>
                  
                  <Skeleton 
                    className={`w-full ${aspectClass} ${
                      showShimmer ? 'animate-pulse' : ''
                    } ${isCompleted && !progress.isFinalizing ? 'bg-green-100 dark:bg-green-900/20' : ''}`}
                  />
                </div>

                {/* Shimmer overlay for current generation or finalizing */}
                {showShimmer && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer rounded-md" />
                )}
              </div>
            );
          })}
        </div>

        {/* Status message */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {progress.completed === 0 && 'Starting bulk image generation...'}
            {progress.completed > 0 && progress.completed < progress.total && 
              `Generated ${progress.completed} of ${progress.total} images`}
            {progress.completed === progress.total && 'Finalizing all images...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};