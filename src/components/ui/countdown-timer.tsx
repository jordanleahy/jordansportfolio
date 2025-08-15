import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  elapsedTime: number;
  duration?: number; // Duration in milliseconds
  className?: string;
  showProgress?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  elapsedTime,
  duration = 90000, // 90 seconds default
  className,
  showProgress = true
}) => {
  const remainingTime = Math.max(0, duration - elapsedTime);
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  const progressPercentage = Math.max(0, (remainingTime / duration) * 100);
  
  // Time formatting
  const timeDisplay = remainingTime > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : "Finalizing...";
  
  // Color based on remaining time
  const getTimeColor = () => {
    if (remainingTime <= 0) return "text-muted-foreground";
    if (remainingTime <= 30000) return "text-destructive"; // Last 30 seconds - red
    if (remainingTime <= 60000) return "text-yellow-600"; // Last minute - yellow
    return "text-primary"; // More than 1 minute - primary
  };

  return (
    <div className={cn(
      "flex items-center gap-3",
      "animate-in fade-in-0 duration-200",
      className
    )}>
      {/* Progress Ring */}
      {showProgress && (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
            {/* Background circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-muted-foreground/20"
            />
            {/* Progress circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                getTimeColor()
              )}
              style={{
                strokeDasharray: `${2 * Math.PI * 12}`,
                strokeDashoffset: `${2 * Math.PI * 12 * (1 - progressPercentage / 100)}`
              }}
            />
          </svg>
          <Clock className={cn(
            "absolute w-3 h-3",
            getTimeColor(),
            remainingTime > 0 && remainingTime <= 30000 && "animate-pulse"
          )} />
        </div>
      )}
      
      {/* Time Display */}
      <div className="flex flex-col">
        <span className={cn(
          "font-mono text-sm font-medium",
          getTimeColor()
        )}>
          {timeDisplay}
        </span>
        <span className="text-xs text-muted-foreground">
          {remainingTime > 0 ? "Image generating..." : "Almost done..."}
        </span>
      </div>
    </div>
  );
};