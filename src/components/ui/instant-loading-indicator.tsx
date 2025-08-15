import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountdownTimer } from './countdown-timer';

interface InstantLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  elapsedTime?: number;
  className?: string;
  showCountdown?: boolean;
  countdownDuration?: number; // Duration in milliseconds
}

export const InstantLoadingIndicator: React.FC<InstantLoadingIndicatorProps> = ({
  isVisible,
  message = "Generating...",
  elapsedTime = 0,
  className,
  showCountdown = false,
  countdownDuration = 90000
}) => {
  if (!isVisible) return null;

  // Use countdown timer if enabled
  if (showCountdown) {
    return (
      <CountdownTimer 
        elapsedTime={elapsedTime}
        duration={countdownDuration}
        className={className}
        showProgress={true}
      />
    );
  }

  // Original behavior for non-countdown mode
  const getProgressMessage = () => {
    if (elapsedTime < 2000) return message;
    if (elapsedTime < 5000) return "Processing your request...";
    if (elapsedTime < 8000) return "Almost there...";
    return "Still working on it...";
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      "animate-in fade-in-0 duration-200",
      className
    )}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{getProgressMessage()}</span>
      {elapsedTime > 3000 && (
        <span className="text-xs">
          ({Math.floor(elapsedTime / 1000)}s)
        </span>
      )}
    </div>
  );
};