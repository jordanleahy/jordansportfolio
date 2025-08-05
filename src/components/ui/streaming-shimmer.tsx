import { cn } from "@/lib/utils";
import { Loader2, ImageIcon, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface StreamingProgress {
  stage: string;
  progress?: number;
  partialImage?: string;
  imageUrl?: string;
}

interface StreamingShimmerProps {
  className?: string;
  streamingProgress?: StreamingProgress | null;
  isGenerating?: boolean;
  error?: string | null;
  fallbackIcon?: React.ReactNode;
}

export const StreamingShimmer = ({ 
  className = "",
  streamingProgress,
  isGenerating = false,
  error = null,
  fallbackIcon
}: StreamingShimmerProps) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageOpacity, setImageOpacity] = useState(0);
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds

  // Update current image and opacity based on streaming progress
  useEffect(() => {
    if (streamingProgress?.partialImage) {
      setCurrentImage(streamingProgress.partialImage);
      // Progressive opacity based on progress
      const progress = streamingProgress.progress || 0;
      if (progress < 30) {
        setImageOpacity(0.3);
      } else if (progress < 70) {
        setImageOpacity(0.6);
      } else {
        setImageOpacity(0.8);
      }
    } else if (streamingProgress?.imageUrl) {
      setCurrentImage(streamingProgress.imageUrl);
      setImageOpacity(1);
    }
  }, [streamingProgress]);

  // Countdown timer for generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      // Reset countdown when generation starts
      setCountdown(180);
      
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Cleanup image URL on unmount
  useEffect(() => {
    return () => {
      if (currentImage && currentImage.startsWith('data:')) {
        // Cleanup base64 URLs
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [currentImage]);

  // Format countdown time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={cn(
        "w-full h-full relative overflow-hidden bg-gradient-to-br from-destructive/10 via-destructive/5 to-muted/20",
        "flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center justify-center text-center p-4">
          <ImageIcon className="h-8 w-8 text-destructive/60 mb-2" />
          <div className="text-xs text-destructive">
            Generation failed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full h-full relative overflow-hidden",
      className
    )}>
      {/* Countdown timer */}
      {isGenerating && (
        <div className="absolute top-2 left-2 right-2 z-10">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-center gap-2 border border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {formatTime(countdown)}
            </span>
          </div>
        </div>
      )}

      {/* Background shimmer animation */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
        currentImage ? "opacity-30" : "opacity-100"
      )} />

      {/* Streaming image with progressive enhancement */}
      {currentImage && (
        <img 
          src={currentImage}
          alt="Generating preview"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-500",
            imageOpacity < 1 ? "filter blur-sm" : "filter blur-none"
          )}
          style={{ 
            opacity: imageOpacity,
            transform: `scale(${0.95 + (imageOpacity * 0.05)})` // Subtle scale effect
          }}
          onError={() => setCurrentImage(null)}
        />
      )}

      {/* Fallback icon when no image and not generating */}
      {!currentImage && !isGenerating && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallbackIcon || <ImageIcon className="h-12 w-12 text-primary/40" />}
        </div>
      )}
    </div>
  );
};