import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Clock } from 'lucide-react';
import { SimpleShimmer } from './simple-shimmer';

interface ProgressiveImagePreviewProps {
  previewUrl?: string | null;
  finalUrl?: string | null;
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
  hasPreview: boolean;
  className?: string;
  aspectRatio?: string;
}

export const ProgressiveImagePreview: React.FC<ProgressiveImagePreviewProps> = ({
  previewUrl,
  finalUrl,
  isGenerating,
  progress,
  currentStep,
  estimatedTimeRemaining,
  hasPreview,
  className,
  aspectRatio = "1/1"
}) => {
  const imageToShow = finalUrl || previewUrl;
  const isPreviewOnly = previewUrl && !finalUrl;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg border bg-muted",
        className
      )}
      style={{ aspectRatio }}
    >
      {/* Loading state */}
      {isGenerating && !imageToShow && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted">
          <SimpleShimmer aspectRatio={aspectRatio} />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">{currentStep}</p>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {estimatedTimeRemaining > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{Math.ceil(estimatedTimeRemaining / 1000)}s remaining</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image display */}
      {imageToShow && (
        <div className="relative h-full">
          <img
            src={imageToShow}
            alt="Generated content"
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isPreviewOnly && "filter blur-[0.5px] brightness-95" // Subtle hint it's preview
            )}
          />
          
          {/* Preview indicator */}
          {isPreviewOnly && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded-full backdrop-blur-sm">
                <Zap className="h-3 w-3" />
                <span>Preview</span>
              </div>
            </div>
          )}
          
          {/* Upgrading indicator */}
          {isGenerating && hasPreview && !finalUrl && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-foreground">Generating full quality...</span>
                </div>
                <div className="mt-1 w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                    style={{ width: `${Math.max(progress - 50, 0) * 2}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Final quality indicator */}
          {finalUrl && !isGenerating && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-success/90 text-success-foreground text-xs rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 bg-current rounded-full"></span>
                <span>HD Quality</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && !imageToShow && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
              <Zap className="h-8 w-8" />
            </div>
            <p className="text-sm">Ready to generate</p>
          </div>
        </div>
      )}
    </div>
  );
};