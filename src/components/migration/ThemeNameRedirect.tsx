import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
// ❌ BAD: Phase 2 migration incomplete - using theme name lookup
import { useThemeByName } from '@/hooks/useOptimizedStories';
import { CalendarSkeletonLoader } from '@/components/performance/SkeletonLoader';

/**
 * ❌ BAD: Migration component - Phase 2 incomplete
 * TODO: This component uses theme name lookup and should be optimized
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