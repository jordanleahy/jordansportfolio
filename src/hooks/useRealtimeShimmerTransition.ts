import { useState, useEffect, useRef } from 'react';
import { SHIMMER_CONSTANTS } from '@/constants/shimmerConstants';
import { ThemeWithPosts, PendingTheme } from '@/types/stories';

interface RealtimeShimmerTransitionOptions {
  themes: ThemeWithPosts[];
  pendingTheme: PendingTheme | null;
  onTransitionComplete?: (completedTheme: ThemeWithPosts) => void;
}

interface TransitionState {
  isTransitioning: boolean;
  fromShimmer: boolean;
  themeId: string | null;
  progress: number;
}

/**
 * Enhanced hook for managing real-time shimmer to post transitions
 * Provides smooth animations and progress tracking
 */
export const useRealtimeShimmerTransition = ({
  themes,
  pendingTheme,
  onTransitionComplete
}: RealtimeShimmerTransitionOptions) => {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    fromShimmer: false,
    themeId: null,
    progress: 0
  });

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastCompletedThemeRef = useRef<string | null>(null);

  // Monitor for theme completion and trigger transitions
  useEffect(() => {
    if (!pendingTheme || themes.length === 0) {
      return;
    }

    // Look for completed theme matching pending theme
    const completedTheme = themes.find(theme => {
      if (pendingTheme.theme_id) {
        return theme.id === pendingTheme.theme_id && 
               theme.prompt_generation_status === SHIMMER_CONSTANTS.STATUS.COMPLETED;
      }
      return false;
    });

    if (completedTheme && lastCompletedThemeRef.current !== completedTheme.id) {
      console.log('🎬 Starting real-time shimmer transition for:', completedTheme.theme_name);
      startTransition(completedTheme);
      lastCompletedThemeRef.current = completedTheme.id;
    }
  }, [themes, pendingTheme]);

  const startTransition = (completedTheme: ThemeWithPosts) => {
    setTransitionState({
      isTransitioning: true,
      fromShimmer: true,
      themeId: completedTheme.id,
      progress: 0
    });

    // Animate progress over time for smooth transition
    let progress = 0;
    progressInterval.current = setInterval(() => {
      progress += 10;
      
      setTransitionState(prev => ({
        ...prev,
        progress: Math.min(progress, 100)
      }));

      if (progress >= 100) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        
        // Complete transition
        setTimeout(() => {
          setTransitionState({
            isTransitioning: false,
            fromShimmer: false,
            themeId: null,
            progress: 0
          });
          
          onTransitionComplete?.(completedTheme);
        }, SHIMMER_CONSTANTS.TIMEOUTS.AUTO_NAVIGATION_DELAY);
      }
    }, 50); // Update every 50ms for smooth animation
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Helper to get transition classes for animations
  const getTransitionClasses = (themeId: string) => {
    if (!transitionState.isTransitioning || transitionState.themeId !== themeId) {
      return '';
    }

    const progress = transitionState.progress;
    
    if (progress < 50) {
      // Shimmer fade out phase
      return 'animate-shimmer-fade-out';
    } else {
      // Content fade in phase
      return 'animate-content-fade-in';
    }
  };

  // Check if a specific theme is transitioning
  const isThemeTransitioning = (themeId: string) => {
    return transitionState.isTransitioning && transitionState.themeId === themeId;
  };

  // Check if any theme is transitioning
  const hasActiveTransition = () => {
    return transitionState.isTransitioning;
  };

  return {
    transitionState,
    getTransitionClasses,
    isThemeTransitioning,
    hasActiveTransition,
    isTransitioningFromShimmer: transitionState.fromShimmer
  };
};