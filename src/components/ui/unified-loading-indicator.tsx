import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedLoadingIndicatorProps {
  isVisible: boolean;
  variant?: 'overlay' | 'inline' | 'button';
  message?: string;
  timerSeconds?: number;
  showTimer?: boolean;
  isTimerExpired?: boolean;
  className?: string;
  icon?: 'loader' | 'refresh';
  size?: 'sm' | 'md' | 'lg';
}

export const UnifiedLoadingIndicator: React.FC<UnifiedLoadingIndicatorProps> = ({
  isVisible,
  variant = 'overlay',
  message = "Processing...",
  timerSeconds,
  showTimer = false,
  isTimerExpired = false,
  className,
  icon = 'loader',
  size = 'md'
}) => {
  if (!isVisible) return null;

  const getProgressMessage = () => {
    if (showTimer && timerSeconds !== undefined) {
      if (isTimerExpired) {
        return `${message} (Processing...)`;
      }
      return `${message} (${timerSeconds}s)`;
    }
    return message;
  };

  const sizeClasses = {
    sm: 'h-3 w-3 text-xs px-2 py-1',
    md: 'h-4 w-4 text-sm px-3 py-2', 
    lg: 'h-5 w-5 text-base px-4 py-3'
  };

  const variantClasses = {
    overlay: "inline-flex items-center gap-2 text-white bg-black/80 backdrop-blur-sm rounded-lg shadow-lg animate-in fade-in-0 duration-200",
    inline: "inline-flex items-center gap-2 text-muted-foreground",
    button: "inline-flex items-center gap-2"
  };

  const IconComponent = icon === 'refresh' ? RefreshCw : Loader2;

  return (
    <div className={cn(
      variantClasses[variant],
      sizeClasses[size],
      variant === 'overlay' && "max-w-[90vw] sm:max-w-none",
      className
    )}>
      <IconComponent className={cn(
        "animate-spin flex-shrink-0",
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      )} />
      <span className="truncate">{getProgressMessage()}</span>
    </div>
  );
};