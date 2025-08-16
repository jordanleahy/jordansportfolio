import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PendingTheme, ThemeWithPosts } from '@/types/stories';

interface ThemeLifecycleShimmerOptions {
  pendingTheme: PendingTheme | null;
  setPendingTheme: React.Dispatch<React.SetStateAction<PendingTheme | null>>;
  setAvailableThemes: React.Dispatch<React.SetStateAction<ThemeWithPosts[]>>;
}

/**
 * Hook to manage shimmer visibility based on theme lifecycle and user interaction
 * Keeps shimmer until user navigates away or explicitly dismisses
 */
export const useThemeLifecycleShimmer = ({
  pendingTheme,
  setPendingTheme,
  setAvailableThemes
}: ThemeLifecycleShimmerOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastLocationRef = useRef(location.pathname);

  // Centralized cleanup function
  const clearPendingThemeState = () => {
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
  };

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