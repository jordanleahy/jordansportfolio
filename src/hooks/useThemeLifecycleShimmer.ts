import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PendingTheme, ThemeWithPosts } from '@/types/stories';

interface ThemeLifecycleShimmerOptions {
  pendingTheme: PendingTheme | null;
  setPendingTheme: (theme: PendingTheme | null) => void;
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

  // Clear pending theme when user navigates away from stories page
  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = lastLocationRef.current;
    
    // If user navigated away from /stories to another page
    if (lastPath === '/stories' && currentPath !== '/stories' && pendingTheme) {
      console.log('🚢 User navigated away from stories, clearing pending theme');
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
    }
    
    lastLocationRef.current = currentPath;
  }, [location.pathname, pendingTheme, setPendingTheme, setAvailableThemes]);

  // Function to manually dismiss shimmer
  const dismissShimmer = () => {
    console.log('❌ User manually dismissed shimmer');
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
  };

  // Function to handle theme card click (navigation)
  const handleThemeClick = (themeId: string) => {
    console.log('🎯 User clicked theme, clearing pending state');
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
    navigate(`/stories/id/${themeId}`);
  };

  return {
    dismissShimmer,
    handleThemeClick,
    shouldShowShimmer: !!pendingTheme
  };
};