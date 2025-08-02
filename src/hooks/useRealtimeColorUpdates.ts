import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { ColorTheme } from '@/types/colorTheme';
import { useRealtimeColorThemes } from '@/hooks/useRealtimeColorThemes';
import { toast } from 'sonner';

interface ColorChangeEvent {
  property: string;
  value: string;
  user_id: string;
  timestamp: number;
  preview?: boolean;
}

interface UseRealtimeColorUpdatesOptions {
  enabled?: boolean;
  allowPreview?: boolean;
  debounceMs?: number;
  onColorChange?: (event: ColorChangeEvent) => void;
  onConflict?: (event: ColorChangeEvent) => void;
}

export const useRealtimeColorUpdates = (options: UseRealtimeColorUpdatesOptions = {}) => {
  const {
    enabled = true,
    allowPreview = true,
    debounceMs = 300,
    onColorChange,
    onConflict
  } = options;

  const [previewColors, setPreviewColors] = useState<Record<string, string>>({});
  const [appliedColors, setAppliedColors] = useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastChangeUser, setLastChangeUser] = useState<string | null>(null);
  const [colorHistory, setColorHistory] = useState<Record<string, string>>({});
  
  const previewTimeoutRef = useRef<NodeJS.Timeout>();
  const conflictTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced color changes to prevent rapid updates
  const debouncedColorChange = useDebounce((colors: Record<string, string>) => {
    applyColorsToDOM(colors, false);
    setAppliedColors(colors);
  }, debounceMs);

  // Listen to real-time color theme updates
  useRealtimeColorThemes({
    enabled,
    onThemeUpdated: useCallback((theme: ColorTheme) => {
      const newColors = {
        '--primary': theme.primary_color,
        '--secondary': theme.secondary_color,
        '--accent': theme.accent_color,
        '--background': theme.background_color,
        '--foreground': theme.text_color,
        '--border': theme.border_color,
      };

      // Check for conflicts with current user changes
      const hasConflict = Object.keys(previewColors).some(key => 
        previewColors[key] !== newColors[key] && isPreviewMode
      );

      if (hasConflict && onConflict) {
        onConflict({
          property: 'theme',
          value: JSON.stringify(newColors),
          user_id: theme.user_id,
          timestamp: Date.now()
        });
        
        // Show conflict resolution toast
        toast.warning(
          'Another user updated colors while you were previewing. Your changes are preserved.',
          {
            action: {
              label: 'Apply My Changes',
              onClick: () => applyPreviewColors(),
            },
          }
        );
        return;
      }

      // Apply colors if no preview is active
      if (!isPreviewMode) {
        debouncedColorChange(newColors);
      }

      setLastChangeUser(theme.user_id);
    }, [previewColors, isPreviewMode, onConflict, debouncedColorChange]),
  });

  // Apply colors to the DOM
  const applyColorsToDOM = useCallback((colors: Record<string, string>, isPreview = false) => {
    const root = document.documentElement;
    
    // Store current colors for rollback if this is the first change
    if (!isPreview && Object.keys(colorHistory).length === 0) {
      const currentColors: Record<string, string> = {};
      Object.keys(colors).forEach(property => {
        const currentValue = getComputedStyle(root).getPropertyValue(property);
        if (currentValue) {
          currentColors[property] = currentValue.trim();
        }
      });
      setColorHistory(currentColors);
    }

    // Apply the colors with smooth transition
    root.style.transition = 'all 0.3s ease-in-out';
    
    Object.entries(colors).forEach(([property, value]) => {
      // Validate color value before applying
      if (isValidColor(value)) {
        root.style.setProperty(property, value);
      } else {
        console.warn(`Invalid color value: ${value} for property: ${property}`);
      }
    });

    // Remove transition after applying
    setTimeout(() => {
      root.style.removeProperty('transition');
    }, 300);
  }, [colorHistory]);

  // Validate color values
  const isValidColor = useCallback((color: string): boolean => {
    // Check for common color formats
    const colorRegex = /^(#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})|rgb\(|rgba\(|hsl\(|hsla\(|\d+\s+\d+%?\s+\d+%?)/;
    return colorRegex.test(color.trim());
  }, []);

  // Preview color changes
  const previewColor = useCallback((property: string, value: string) => {
    if (!allowPreview || !enabled) return;

    const newPreviewColors = { ...previewColors, [property]: value };
    setPreviewColors(newPreviewColors);
    setIsPreviewMode(true);
    
    applyColorsToDOM(newPreviewColors, true);

    // Auto-revert preview after 5 seconds
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      revertPreview();
    }, 5000);

    if (onColorChange) {
      onColorChange({
        property,
        value,
        user_id: 'current-user', // This would come from auth context
        timestamp: Date.now(),
        preview: true
      });
    }
  }, [allowPreview, enabled, previewColors, applyColorsToDOM, onColorChange]);

  // Apply preview colors permanently
  const applyPreviewColors = useCallback(() => {
    if (Object.keys(previewColors).length === 0) return;

    debouncedColorChange(previewColors);
    setIsPreviewMode(false);
    setPreviewColors({});
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    toast.success('Colors applied successfully');
  }, [previewColors, debouncedColorChange]);

  // Revert preview to last applied state
  const revertPreview = useCallback(() => {
    if (!isPreviewMode) return;

    applyColorsToDOM(appliedColors);
    setIsPreviewMode(false);
    setPreviewColors({});
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
  }, [isPreviewMode, appliedColors, applyColorsToDOM]);

  // Rollback to previous colors
  const rollbackColors = useCallback(() => {
    if (Object.keys(colorHistory).length === 0) {
      toast.error('No previous colors to rollback to');
      return;
    }

    applyColorsToDOM(colorHistory);
    setAppliedColors(colorHistory);
    setIsPreviewMode(false);
    setPreviewColors({});
    
    toast.success('Colors rolled back to previous state');
  }, [colorHistory, applyColorsToDOM]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      if (conflictTimeoutRef.current) {
        clearTimeout(conflictTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isPreviewMode,
    previewColors,
    appliedColors,
    lastChangeUser,
    
    // Actions
    previewColor,
    applyPreviewColors,
    revertPreview,
    rollbackColors,
    
    // Utilities
    isValidColor,
  };
};