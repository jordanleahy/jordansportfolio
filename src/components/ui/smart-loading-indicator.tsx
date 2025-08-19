import React from 'react';
import { InstantLoadingIndicator } from '@/components/ui/instant-loading-indicator';
import { UnifiedLoadingIndicator } from '@/components/ui/unified-loading-indicator';
import { useInstantFeedback } from '@/hooks/useInstantFeedback';
import { useImageGenerationTimerContext } from '@/contexts/ImageGenerationTimerContext';

interface SmartLoadingIndicatorProps {
  isVisible: boolean;
  postId?: string;
  useInstantFeedback?: boolean;
  variant?: 'overlay' | 'inline' | 'button';
  message?: string;
  className?: string;
  icon?: 'loader' | 'refresh';
  size?: 'sm' | 'md' | 'lg';
  elapsedTime?: number;
}

export const SmartLoadingIndicator: React.FC<SmartLoadingIndicatorProps> = ({
  isVisible,
  postId,
  useInstantFeedback: useInstant = false,
  variant = 'overlay',
  message = "Processing...",
  className,
  icon = 'loader',
  size = 'md',
  elapsedTime
}) => {
  const { isGenerating, getElapsedTime } = useInstantFeedback();
  const timer = useImageGenerationTimerContext();

  if (!isVisible) return null;

  // Use instant feedback for immediate user response (first few seconds)
  if (useInstant && postId && isGenerating(postId)) {
    return (
      <InstantLoadingIndicator
        isVisible={true}
        message={message}
        elapsedTime={elapsedTime || getElapsedTime(postId)}
        className={className}
      />
    );
  }

  // Use unified timer for longer operations with countdown
  if (timer.isRunning || timer.isExpired) {
    return (
      <UnifiedLoadingIndicator
        isVisible={true}
        variant={variant}
        message={message}
        timerSeconds={timer.secondsRemaining}
        showTimer={timer.isRunning}
        isTimerExpired={timer.isExpired}
        className={className}
        icon={icon}
        size={size}
      />
    );
  }

  return null;
};