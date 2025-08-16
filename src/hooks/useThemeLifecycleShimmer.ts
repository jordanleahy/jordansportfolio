import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PendingTheme, ThemeWithPosts } from '@/types/stories';
import { SHIMMER_CONSTANTS } from '@/constants/shimmerConstants';
import { useRealtimeShimmerTransition } from '@/hooks/useRealtimeShimmerTransition';

interface ThemeLifecycleShimmerOptions {
  pendingTheme: PendingTheme | null;
  setPendingTheme: React.Dispatch<React.SetStateAction<PendingTheme | null>>;
  setAvailableThemes: React.Dispatch<React.SetStateAction<ThemeWithPosts[]>>;
  availableThemes: ThemeWithPosts[];
}

/**
 * Hook to manage shimmer visibility based on theme lifecycle and user interaction
 * Keeps shimmer until user navigates away or explicitly dismisses
 */
export const useThemeLifecycleShimmer = ({
  pendingTheme,
  setPendingTheme,
  setAvailableThemes,
  availableThemes
}: ThemeLifecycleShimmerOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastLocationRef = useRef(location.pathname);

  // Enhanced real-time shimmer transition
  const {
    transitionState,
    getTransitionClasses,
    isThemeTransitioning,
    hasActiveTransition
  } = useRealtimeShimmerTransition({
    themes: availableThemes,
    pendingTheme,
    onTransitionComplete: (completedTheme) => {
      console.log('✅ Shimmer transition completed, auto-navigating to:', completedTheme.id);
      clearPendingThemeState();
      
      // Navigate to completed theme with smooth transition
      setTimeout(() => {
        navigate(`/stories/id/${completedTheme.id}`);
      }, SHIMMER_CONSTANTS.TIMEOUTS.AUTO_NAVIGATION_DELAY);
    }
  });

  // Helper function to check if a theme is ready (both prompt generation and lifecycle must be complete)
  const isThemeReady = (theme: ThemeWithPosts) => {
    const promptComplete = theme.prompt_generation_status === SHIMMER_CONSTANTS.STATUS.COMPLETED;
    const lifecycleComplete = !theme.lifecycle_status || 
                             theme.lifecycle_status === SHIMMER_CONSTANTS.LIFECYCLE_STATUS.COMPLETED ||
                             theme.lifecycle_status === SHIMMER_CONSTANTS.LIFECYCLE_STATUS.READY;
    return promptComplete && lifecycleComplete;
  };

  // Centralized cleanup function
  const clearPendingThemeState = () => {
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith(SHIMMER_CONSTANTS.PREFIXES.PENDING_THEME)));
  };

  // Enhanced theme completion detection with stale state cleanup
  useEffect(() => {
    if (!pendingTheme) return;

    if (availableThemes.length > 0) {
      // Look for completed theme that matches our pending theme
      const completedTheme = availableThemes.find(theme => {
        if (pendingTheme.theme_id) {
          return theme.id === pendingTheme.theme_id && isThemeReady(theme);
        }
        return false;
      });
      
      if (completedTheme && !hasActiveTransition()) {
        console.log('✅ Theme completed, real-time transition will handle navigation:', completedTheme.id);
        // Real-time transition hook will handle the rest
        return;
      }

      // Cleanup stale pending themes
      if (pendingTheme.theme_id) {
        const matchingTheme = availableThemes.find(theme => theme.id === pendingTheme.theme_id);
        
        if (!matchingTheme) {
          console.log('🧹 Stale pending theme detected (no matching theme found), cleaning up:', pendingTheme.theme_name);
          clearPendingThemeState();
        } else if (isThemeReady(matchingTheme)) {
          console.log('🧹 Stale pending theme detected (theme already completed), cleaning up:', pendingTheme.theme_name);
          clearPendingThemeState();
        }
      }
    }

    // Additional cleanup: if no themes are in progress, clear pending theme
    const hasInProgressThemes = availableThemes.some(theme => 
      theme.prompt_generation_status === SHIMMER_CONSTANTS.STATUS.IN_PROGRESS
    );
    
    if (availableThemes.length > 0 && !hasInProgressThemes && pendingTheme) {
      console.log('🧹 No themes in progress, clearing stale pending theme:', pendingTheme.theme_name);
      clearPendingThemeState();
    }
  }, [pendingTheme, availableThemes, hasActiveTransition]);

  // Clear pending theme when user navigates away from stories page
  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = lastLocationRef.current;
    
    // If user navigated away from /stories to another page
    if (lastPath === '/stories' && currentPath !== '/stories' && pendingTheme) {
      console.log('🚢 User navigated away from stories, clearing pending theme');
      console.log('Clearing pending theme:', pendingTheme.theme_name);
      clearPendingThemeState();
    }
    
    lastLocationRef.current = currentPath;
  }, [location.pathname, pendingTheme]);


  // Function to manually dismiss shimmer
  const dismissShimmer = () => {
    console.log('❌ User manually dismissed shimmer');
    clearPendingThemeState();
  };

  // Function to handle theme card click (navigation)
  const handleThemeClick = (themeId: string) => {
    console.log('🎯 User clicked theme, clearing pending state');
    
    // Clear pending state before navigation to prevent race conditions
    clearPendingThemeState();
    
    // Small delay to ensure state updates complete before navigation
    setTimeout(() => {
      navigate(`/stories/id/${themeId}`);
    }, 0);
  };

  return {
    dismissShimmer,
    handleThemeClick,
    shouldShowShimmer: !!pendingTheme,
    // Enhanced transition features
    transitionState,
    getTransitionClasses,
    isThemeTransitioning,
    hasActiveTransition
  };
};