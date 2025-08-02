import { useEffect, useState } from 'react';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';
import { ColorTheme } from '@/types/colorTheme';

interface UseRealtimeColorThemesOptions {
  onThemeCreated?: (theme: ColorTheme) => void;
  onThemeUpdated?: (theme: ColorTheme) => void;
  onThemeDeleted?: (theme: ColorTheme) => void;
  enabled?: boolean;
}

export const useRealtimeColorThemes = (options: UseRealtimeColorThemesOptions = {}) => {
  const { onThemeCreated, onThemeUpdated, onThemeDeleted, enabled = true } = options;
  const [lastUpdate, setLastUpdate] = useState<{
    action: 'created' | 'updated' | 'deleted';
    theme: ColorTheme;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = realtimeEventBus.on('color-theme-changed', (event) => {
      if (event.type !== 'color-theme-changed') return;
      const { action, theme, timestamp } = event.payload;
      
      console.log('🎨 [RealtimeColorThemes] Theme change detected:', { action, theme });
      
      setLastUpdate({ action, theme, timestamp });

      // Call appropriate callback
      if (action === 'created' && onThemeCreated) {
        onThemeCreated(theme);
      } else if (action === 'updated' && onThemeUpdated) {
        onThemeUpdated(theme);
      } else if (action === 'deleted' && onThemeDeleted) {
        onThemeDeleted(theme);
      }
    });

    return unsubscribe;
  }, [enabled, onThemeCreated, onThemeUpdated, onThemeDeleted]);

  return {
    lastUpdate,
    clearLastUpdate: () => setLastUpdate(null)
  };
};