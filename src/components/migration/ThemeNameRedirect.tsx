import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useThemeByName } from '@/hooks/useOptimizedStories';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';

/**
 * Migration component that redirects old theme name URLs to new theme ID URLs
 * /stories/theme/:themeName -> /stories/id/:themeId
 */
export const ThemeNameRedirect = () => {
  const { themeName } = useParams<{ themeName: string }>();
  const decodedThemeName = themeName ? decodeURIComponent(themeName) : '';
  
  const { data: theme, isLoading, error } = useThemeByName(decodedThemeName, !!decodedThemeName);
  
  useEffect(() => {
    console.log('🔄 Theme name redirect:', {
      themeName,
      decodedThemeName,
      themeId: theme?.id,
      isLoading,
      error
    });
  }, [themeName, decodedThemeName, theme?.id, isLoading, error]);

  if (isLoading) {
    return <CalendarSkeletonLoader />;
  }

  if (error || !theme) {
    console.error('❌ Theme not found for migration:', { decodedThemeName, error });
    return <Navigate to="/stories" replace />;
  }

  console.log('✅ Redirecting to theme ID URL:', { 
    fromName: decodedThemeName, 
    toId: theme.id 
  });
  
  return <Navigate to={`/stories/id/${theme.id}`} replace />;
};