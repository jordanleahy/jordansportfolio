import { useState, useCallback, useRef } from 'react';

interface InstantFeedbackState {
  [postId: string]: {
    isGenerating: boolean;
    startTime: number;
  };
}

export const useInstantFeedback = () => {
  const [feedbackState, setFeedbackState] = useState<InstantFeedbackState>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const setInstantLoading = useCallback((postId: string, loading: boolean) => {
    setFeedbackState(prev => {
      if (loading) {
        return {
          ...prev,
          [postId]: {
            isGenerating: true,
            startTime: Date.now()
          }
        };
      } else {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      }
    });
  }, []);

  const debouncedAction = useCallback((
    key: string,
    action: () => void | Promise<void>,
    delay = 300
  ) => {
    // Clear existing timer
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    // Set new timer
    debounceTimers.current[key] = setTimeout(() => {
      action();
      delete debounceTimers.current[key];
    }, delay);
  }, []);

  const isGenerating = useCallback((postId: string) => {
    return feedbackState[postId]?.isGenerating || false;
  }, [feedbackState]);

  const getElapsedTime = useCallback((postId: string) => {
    const state = feedbackState[postId];
    if (!state) return 0;
    return Date.now() - state.startTime;
  }, [feedbackState]);

  const cleanup = useCallback(() => {
    // Clear all timers
    Object.values(debounceTimers.current).forEach(timer => {
      clearTimeout(timer);
    });
    debounceTimers.current = {};
    setFeedbackState({});
  }, []);

  return {
    setInstantLoading,
    debouncedAction,
    isGenerating,
    getElapsedTime,
    cleanup
  };
};