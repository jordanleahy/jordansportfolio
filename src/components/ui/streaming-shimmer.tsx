import { cn } from "@/lib/utils";
import { Loader2, ImageIcon } from "lucide-react";
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

  // Cleanup image URL on unmount
  useEffect(() => {
    return () => {
      if (currentImage && currentImage.startsWith('data:')) {
        // Cleanup base64 URLs
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [currentImage]);

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

      {/* Generation overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
          <div className="text-xs text-white font-medium mb-1">Generating</div>
          {streamingProgress?.progress && (
            <div className="text-xs text-white/80">
              {streamingProgress.progress}%
            </div>
          )}
        </div>
      )}

      {/* Fallback icon when no image and not generating */}
      {!currentImage && !isGenerating && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallbackIcon || <ImageIcon className="h-12 w-12 text-primary/40" />}
        </div>
      )}

      {/* Progress bar */}
      {isGenerating && streamingProgress?.progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${streamingProgress.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};