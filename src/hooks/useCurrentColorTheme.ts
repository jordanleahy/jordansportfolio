import { useState, useEffect } from 'react';
import { ColorTheme } from '@/types/colorTheme';
import { useColorThemes } from '@/hooks/useColorThemes';

interface UseCurrentColorThemeOptions {
  selectedThemeId?: string;
  fallbackToDefault?: boolean;
}

export function useCurrentColorTheme(options: UseCurrentColorThemeOptions = {}) {
  const { selectedThemeId, fallbackToDefault = true } = options;
  const { data: themes = [] } = useColorThemes();
  const [currentTheme, setCurrentTheme] = useState<ColorTheme | null>(null);

  // Theme updates are handled at app level - removed duplicate subscription

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