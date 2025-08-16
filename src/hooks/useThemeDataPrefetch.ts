import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface ThemeData {
  themeId: string;
  theme: string;
  category: string;
}

export const useThemeDataPrefetch = () => {
  const params = useParams();
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ❌ BAD: Using theme name from route params - Phase 1 migration incomplete
    // const theme = params.theme ? decodeURIComponent(params.theme) : '';
    const theme = ''; // REMOVED - use themeId instead
    const category = params.category || 'cdi';
    
    // Set basic theme data immediately for fast access
    setThemeData({ 
      themeId: '', // We'll set this to empty for now since the DB call is complex
      theme, 
      category 
    });
    setIsLoading(false);
  }, [params.theme, params.category]);

  return {
    themeData,
    isLoading,
    error: null,
    getThemeData: () => themeData,
    refreshThemeData: () => Promise.resolve()
  };
};