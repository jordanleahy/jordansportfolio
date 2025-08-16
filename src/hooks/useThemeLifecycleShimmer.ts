import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PendingTheme, ThemeWithPosts } from '@/types/stories';

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

  // Helper function to check if a theme is ready (completed)
  const isThemeReady = (theme: ThemeWithPosts) => {
    return theme.prompt_generation_status === 'completed' && 
           theme.prompt_completion_count === theme.total_posts_count &&
           theme.post_count > 0;
  };

  // Centralized cleanup function
  const clearPendingThemeState = () => {
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
  };

  // Check for theme completion and auto-dismiss shimmer
  useEffect(() => {
    if (pendingTheme && availableThemes.length > 0) {
      // Look for a completed theme that matches our pending theme
      const completedTheme = availableThemes.find(theme => {
        // Match by theme_id (most reliable)
        if (pendingTheme.theme_id) {
          return theme.id === pendingTheme.theme_id && isThemeReady(theme);
        }
        return false;
      });
      
      if (completedTheme) {
        console.log('✅ Theme completed, auto-dismissing shimmer and navigating:', completedTheme.id);
        clearPendingThemeState();
        
        // Auto-navigate to the completed theme
        setTimeout(() => {
          navigate(`/stories/id/${completedTheme.id}`);
        }, 100);
      }
    }
  }, [pendingTheme, availableThemes, navigate]);

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
  }, [location.pathname, pendingTheme, setPendingTheme, setAvailableThemes]);


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
    shouldShowShimmer: !!pendingTheme
  };
};