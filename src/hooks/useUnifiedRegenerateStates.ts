import { useState, useCallback, useRef, useEffect } from 'react';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import type { AspectRatio } from '@/types/bulkImageGeneration';

interface RegenerateTimerState {
  isRunning: boolean;
  secondsRemaining: number;
  isExpired: boolean;
}

interface RegenerateMetrics {
  activeOperations: number;
  lastStartTime: number | null;
  totalDuration: number;
}

/**
 * Unified hook for managing all regenerate states, timers, and loading indicators
 * Consolidates useImageGenerationTimer, useInstantFeedback, and processing states
 * Auto-manages timer lifecycle and provides unified helper functions
 */
export const useUnifiedRegenerateStates = () => {
  const { isProcessing, isGenerating, isAnyImageGenerating } = useProcessingStatesContext();
  
  // Single timer state for all regenerate operations
  const [timerState, setTimerState] = useState<RegenerateTimerState>({
    isRunning: false,
    secondsRemaining: 90,
    isExpired: false
  });

  // Metrics for performance tracking
  const [metrics, setMetrics] = useState<RegenerateMetrics>({
    activeOperations: 0,
    lastStartTime: null,
    totalDuration: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start timer when any image generation begins
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    startTimeRef.current = Date.now();
    setTimerState({
      isRunning: true,
      secondsRemaining: 90,
      isExpired: false
    });

    setMetrics(prev => ({
      ...prev,
      lastStartTime: Date.now(),
      activeOperations: prev.activeOperations + 1
    }));

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, 90 - elapsed);

      setTimerState(prev => ({
        ...prev,
        secondsRemaining: remaining,
        isExpired: remaining === 0
      }));
    }, 1000);
  }, []);

  // Stop timer when all operations complete
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTimerState({
      isRunning: false,
      secondsRemaining: 90,
      isExpired: false
    });

    setMetrics(prev => ({
      ...prev,
      activeOperations: Math.max(0, prev.activeOperations - 1),
      totalDuration: prev.lastStartTime ? Date.now() - prev.lastStartTime : 0
    }));
  }, []);

  // Auto-manage timer based on processing states
  useEffect(() => {
    const hasActiveGeneration = isAnyImageGenerating();
    
    if (hasActiveGeneration && !timerState.isRunning) {
      startTimer();
    } else if (!hasActiveGeneration && timerState.isRunning) {
      stopTimer();
    }
  }, [isAnyImageGenerating, timerState.isRunning, startTimer, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Simplified helper functions
  const getRegenerateButtonText = useCallback((
    postId: string,
    aspectRatio?: AspectRatio,
    hasExistingImage?: boolean
  ): string => {
    if (isProcessing(postId, 'generate', aspectRatio)) {
      return 'Regenerating...';
    }
    if (isAnyImageGenerating() && !isProcessing(postId, 'generate', aspectRatio)) {
      return 'Image Generation in Progress';
    }
    return hasExistingImage ? 'Regenerate' : 'Generate';
  }, [isProcessing, isAnyImageGenerating]);

  const getLoadingMessage = useCallback((hasExistingImage?: boolean): string => {
    return hasExistingImage ? "Regenerating..." : "Generating...";
  }, []);

  const isButtonDisabled = useCallback((
    postId: string,
    aspectRatio?: AspectRatio
  ): boolean => {
    return isProcessing(postId, 'generate', aspectRatio) || 
           (isAnyImageGenerating() && !isProcessing(postId, 'generate', aspectRatio));
  }, [isProcessing, isAnyImageGenerating]);

  return {
    // Timer state
    timer: timerState,
    
    // Processing states
    isProcessing,
    isGenerating,
    isAnyImageGenerating,
    
    // Helper functions
    getRegenerateButtonText,
    getLoadingMessage,
    isButtonDisabled,
    
    // Metrics
    metrics,
    
    // Manual controls (if needed)
    startTimer,
    stopTimer
  };
};