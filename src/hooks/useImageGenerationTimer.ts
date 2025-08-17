import { useState, useCallback, useRef, useEffect } from 'react';

interface TimerState {
  isRunning: boolean;
  secondsRemaining: number;
  isExpired: boolean;
}

export const useImageGenerationTimer = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    secondsRemaining: 90,
    isExpired: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, 90 - elapsed);

      setTimerState(prev => ({
        ...prev,
        secondsRemaining: remaining,
        isExpired: remaining === 0
      }));

      if (remaining === 0) {
        // Don't stop the timer, just mark as expired
        // Timer will show "Processing..." at 0 seconds
      }
    }, 1000);
  }, []);

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
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimerState({
      isRunning: false,
      secondsRemaining: 90,
      isExpired: false
    });
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...timerState,
    startTimer,
    stopTimer,
    resetTimer
  };
};