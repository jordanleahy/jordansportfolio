import { cn } from "@/lib/utils";
import { Loader2, ImageIcon, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Countdown timer logic
  useEffect(() => {
    if (isGenerating) {
      // Reset timer to 3 minutes when generation starts
      setTimeRemaining(180);
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear interval when generation stops
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show shimmer if no image is available, generating, or has error
  const shouldShowShimmer = !currentImage || isGenerating || error;

  return (
    <div className={cn(
      "w-full h-full relative overflow-hidden",
      className
    )}>
      {/* Background shimmer animation */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
        shouldShowShimmer ? "opacity-100" : "opacity-30"
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

      {/* Countdown timer overlay */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md border">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Fallback icon when no image and not generating/error */}
      {!currentImage && !isGenerating && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallbackIcon || <ImageIcon className="h-12 w-12 text-primary/40" />}
        </div>
      )}
    </div>
  );
};