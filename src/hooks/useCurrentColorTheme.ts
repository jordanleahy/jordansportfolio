import { useState, useEffect } from 'react';
import { ColorTheme } from '@/types/colorTheme';
import { useColorThemes } from '@/hooks/useColorThemes';
import { useRealtimeColorThemes } from '@/hooks/useRealtimeColorThemes';

interface UseCurrentColorThemeOptions {
  selectedThemeId?: string;
  fallbackToDefault?: boolean;
}

export function useCurrentColorTheme(options: UseCurrentColorThemeOptions = {}) {
  const { selectedThemeId, fallbackToDefault = true } = options;
  const { data: themes = [] } = useColorThemes();
  const [currentTheme, setCurrentTheme] = useState<ColorTheme | null>(null);

  // Listen for real-time theme updates
  useRealtimeColorThemes({
    onThemeUpdated: (updatedTheme) => {
      if (currentTheme?.id === updatedTheme.id) {
        setCurrentTheme(updatedTheme);
      }
    },
    onThemeDeleted: (deletedTheme) => {
      if (currentTheme?.id === deletedTheme.id) {
        setCurrentTheme(null);
      }
    }
  });

  useEffect(() => {
    if (!themes.length) return;

    let theme: ColorTheme | null = null;

    // Try to find the selected theme
    if (selectedThemeId) {
      theme = themes.find(t => t.id === selectedThemeId) || null;
    }

    // Fallback to default theme if no theme selected or found
    if (!theme && fallbackToDefault) {
      theme = themes.find(t => t.is_default) || themes[0] || null;
    }

    setCurrentTheme(theme);
  }, [themes, selectedThemeId, fallbackToDefault]);

  return {
    currentTheme,
    isLoading: !themes.length,
    hasTheme: !!currentTheme
  };
}