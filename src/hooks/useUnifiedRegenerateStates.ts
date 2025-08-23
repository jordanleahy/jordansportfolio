import { useState, useCallback, useRef, useEffect } from 'react';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import type { AspectRatio } from '@/types/bulkImageGeneration';

interface RegenerateTimerState {
  isRunning: boolean;
  secondsRemaining: number;
  isExpired: boolean;
}

interface CooldownState {
  isActive: boolean;
  secondsRemaining: number;
  lastGenerationTime: number | null;
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

  // Cooldown state for generation spacing (10-15 seconds between generations)
  const [cooldownState, setCooldownState] = useState<CooldownState>({
    isActive: false,
    secondsRemaining: 0,
    lastGenerationTime: null
  });

  // Metrics for performance tracking
  const [metrics, setMetrics] = useState<RegenerateMetrics>({
    activeOperations: 0,
    lastStartTime: null,
    totalDuration: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Constants for cooldown timing
  const COOLDOWN_DURATION = 15; // 15 seconds between generations

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

  // Start cooldown when generation begins
  const startCooldown = useCallback(() => {
    const now = Date.now();
    setCooldownState({
      isActive: true,
      secondsRemaining: COOLDOWN_DURATION,
      lastGenerationTime: now
    });

    // Store in localStorage for cross-tab sync
    localStorage.setItem('lastImageGeneration', now.toString());

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - now) / 1000);
      const remaining = Math.max(0, COOLDOWN_DURATION - elapsed);

      setCooldownState(prev => ({
        ...prev,
        secondsRemaining: remaining,
        isActive: remaining > 0
      }));

      if (remaining === 0) {
        clearInterval(cooldownIntervalRef.current!);
        cooldownIntervalRef.current = null;
      }
    }, 1000);
  }, [COOLDOWN_DURATION]);

  // Check if cooldown should be active on mount (cross-tab sync)
  useEffect(() => {
    const lastGeneration = localStorage.getItem('lastImageGeneration');
    if (lastGeneration) {
      const lastTime = parseInt(lastGeneration);
      const elapsed = Math.floor((Date.now() - lastTime) / 1000);
      const remaining = Math.max(0, COOLDOWN_DURATION - elapsed);

      if (remaining > 0) {
        setCooldownState({
          isActive: true,
          secondsRemaining: remaining,
          lastGenerationTime: lastTime
        });

        cooldownIntervalRef.current = setInterval(() => {
          const currentElapsed = Math.floor((Date.now() - lastTime) / 1000);
          const currentRemaining = Math.max(0, COOLDOWN_DURATION - currentElapsed);

          setCooldownState(prev => ({
            ...prev,
            secondsRemaining: currentRemaining,
            isActive: currentRemaining > 0
          }));

          if (currentRemaining === 0) {
            clearInterval(cooldownIntervalRef.current!);
            cooldownIntervalRef.current = null;
          }
        }, 1000);
      }
    }
  }, [COOLDOWN_DURATION]);

  // Auto-manage timer based on processing states
  useEffect(() => {
    const hasActiveGeneration = isAnyImageGenerating();
    
    if (hasActiveGeneration && !timerState.isRunning) {
      startTimer();
      // Start cooldown when generation begins
      if (!cooldownState.isActive) {
        startCooldown();
      }
    } else if (!hasActiveGeneration && timerState.isRunning) {
      stopTimer();
    }
  }, [isAnyImageGenerating, timerState.isRunning, cooldownState.isActive, startTimer, stopTimer, startCooldown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Simplified helper functions with cooldown support
  const getRegenerateButtonText = useCallback((
    postId: string,
    aspectRatio?: AspectRatio,
    hasExistingImage?: boolean
  ): string => {
    // Priority 1: Currently processing this specific image
    if (isProcessing(postId, 'generate', aspectRatio)) {
      return 'Regenerating...';
    }
    
    // Priority 2: Cooldown is active (highest priority after processing)
    if (cooldownState.isActive) {
      return `Generate in ${cooldownState.secondsRemaining}s`;
    }
    
    // Priority 3: Other images generating
    if (isAnyImageGenerating() && !isProcessing(postId, 'generate', aspectRatio)) {
      return 'Image Generation in Progress';
    }
    
    // Priority 4: Normal state
    return hasExistingImage ? 'Regenerate' : 'Generate';
  }, [isProcessing, isAnyImageGenerating, cooldownState.isActive, cooldownState.secondsRemaining]);

  const getLoadingMessage = useCallback((hasExistingImage?: boolean): string => {
    return hasExistingImage ? "Regenerating..." : "Generating...";
  }, []);

  const isButtonDisabled = useCallback((
    postId: string,
    aspectRatio?: AspectRatio
  ): boolean => {
    return isProcessing(postId, 'generate', aspectRatio) || 
           cooldownState.isActive ||
           (isAnyImageGenerating() && !isProcessing(postId, 'generate', aspectRatio));
  }, [isProcessing, isAnyImageGenerating, cooldownState.isActive]);

  const getCooldownMessage = useCallback((): string => {
    if (cooldownState.isActive) {
      return `Quality optimization active • Generate in ${cooldownState.secondsRemaining}s`;
    }
    return '';
  }, [cooldownState.isActive, cooldownState.secondsRemaining]);

  return {
    // Timer state
    timer: timerState,
    
    // Cooldown state
    cooldown: cooldownState,
    
    // Processing states
    isProcessing,
    isGenerating,
    isAnyImageGenerating,
    
    // Helper functions
    getRegenerateButtonText,
    getLoadingMessage,
    isButtonDisabled,
    getCooldownMessage,
    
    // Metrics
    metrics,
    
    // Manual controls (if needed)
    startTimer,
    stopTimer,
    startCooldown
  };
};