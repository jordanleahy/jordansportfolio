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
  const [shimmerStartTime] = useState(Date.now());

  // Clear pending theme when user navigates away from stories page
  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = lastLocationRef.current;
    
    // If user navigated away from /stories to another page
    if (lastPath === '/stories' && currentPath !== '/stories' && pendingTheme) {
      console.log('🚢 User navigated away from stories, clearing pending theme');
      
      // Use functional updates to avoid race conditions
      setPendingTheme(prev => {
        if (prev) {
          console.log('Clearing pending theme:', prev.theme_name);
          return null;
        }
        return prev;
      });
      
      setAvailableThemes(prev => {
        const filtered = prev.filter(theme => !theme.id.startsWith('pending-'));
        if (filtered.length !== prev.length) {
          console.log('Removed pending themes from list');
        }
        return filtered;
      });
    }
    
    lastLocationRef.current = currentPath;
  }, [location.pathname, pendingTheme, setPendingTheme, setAvailableThemes]);

  // Auto-dismiss shimmer after timeout or when theme has posts
  useEffect(() => {
    if (!pendingTheme) return;

    // Set up a timeout to auto-dismiss stale shimmers (5 minutes)
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auto-dismissing stale shimmer after timeout');
      setPendingTheme(null);
      setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timeoutId);
  }, [pendingTheme, setPendingTheme, setAvailableThemes]);

  // Function to manually dismiss shimmer
  const dismissShimmer = () => {
    console.log('❌ User manually dismissed shimmer');
    setPendingTheme(prev => {
      if (prev) {
        console.log('Dismissing pending theme:', prev.theme_name);
        return null;
      }
      return prev;
    });
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
  };

  // Function to handle theme card click (navigation)
  const handleThemeClick = (themeId: string) => {
    console.log('🎯 User clicked theme, clearing pending state');
    
    // Clear pending state before navigation to prevent race conditions
    setPendingTheme(null);
    setAvailableThemes(prev => prev.filter(theme => !theme.id.startsWith('pending-')));
    
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