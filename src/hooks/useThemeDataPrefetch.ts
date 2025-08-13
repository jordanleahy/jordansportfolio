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
    const theme = params.theme ? decodeURIComponent(params.theme) : '';
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