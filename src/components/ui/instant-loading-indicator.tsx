import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstantLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  elapsedTime?: number;
  className?: string;
  timerSeconds?: number;
  showTimer?: boolean;
  isTimerExpired?: boolean;
}

export const InstantLoadingIndicator: React.FC<InstantLoadingIndicatorProps> = ({
  isVisible,
  message = "Generating...",
  elapsedTime = 0,
  className,
  timerSeconds,
  showTimer = false,
  isTimerExpired = false
}) => {
  if (!isVisible) return null;

  const getProgressMessage = () => {
    if (showTimer && timerSeconds !== undefined) {
      if (isTimerExpired) {
        return `${message} (Processing...)`;
      }
      return `${message} (${timerSeconds}s)`;
    }
    
    if (elapsedTime < 2000) return message;
    if (elapsedTime < 5000) return "Processing your request...";
    if (elapsedTime < 8000) return "Almost there...";
    return "Still working on it...";
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 text-white",
      "text-sm sm:text-sm text-xs", // Smaller text on mobile
      "bg-black/80 backdrop-blur-sm rounded-lg",
      "px-2 py-1.5 sm:px-3 sm:py-2", // Smaller padding on mobile
      "animate-in fade-in-0 duration-200 shadow-lg",
      "max-w-[90vw] sm:max-w-none", // Prevent overflow on small screens
      className
    )}>
      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
      <span className="truncate">{getProgressMessage()}</span>
      {!showTimer && elapsedTime > 3000 && (
        <span className="text-xs opacity-80 hidden sm:inline">
          ({Math.floor(elapsedTime / 1000)}s)
        </span>
      )}
    </div>
  );
};