import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette, Plus } from "lucide-react";
import { ColorTheme } from "@/types/colorTheme";
import { useRealtimeColorThemes } from '@/hooks/useRealtimeColorThemes';

interface ColorThemeSelectorProps {
  themes: ColorTheme[];
  selectedThemeId?: string;
  onThemeChange: (themeId: string) => void;
  showAddOption?: boolean;
  onAddTheme?: () => void;
  className?: string;
}

export function ColorThemeSelector({ 
  themes, 
  selectedThemeId, 
  onThemeChange,
  showAddOption = false,
  onAddTheme,
  className 
}: ColorThemeSelectorProps) {
  const selectedTheme = themes.find(t => t.id === selectedThemeId);
  const defaultTheme = themes.find(t => t.is_default);
  const displayTheme = selectedTheme || defaultTheme;

  // Listen for real-time color theme changes
  useRealtimeColorThemes({
    onThemeCreated: () => {
      // New theme available in selector
    },
    onThemeUpdated: (theme) => {
      // Theme updated
    },
    onThemeDeleted: (theme) => {
      // If the currently selected theme was deleted, clear selection
      if (selectedThemeId === theme.id) {
        onThemeChange('');
      }
    }
  });

  const handleValueChange = (value: string) => {
    if (value === "__add_new__") {
      onAddTheme?.();
    } else {
      onThemeChange(value);
    }
  };

  return (
    <Select value={selectedThemeId || ""} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 w-fit border border-input bg-background px-2 py-1 text-xs sm:text-sm [&>svg]:hidden">
          <div className="flex gap-1">
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: displayTheme?.primary_color }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: displayTheme?.secondary_color }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: displayTheme?.accent_color }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: displayTheme?.background_color }}
            />
          </div>
        </SelectTrigger>
        <SelectContent className="w-[120px] bg-background border z-50">
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id} className="pl-2 [&>span:first-child]:hidden">
              <div className="flex gap-1">
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.primary_color }}
                />
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.secondary_color }}
                />
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.accent_color }}
                />
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.background_color }}
                />
              </div>
            </SelectItem>
          ))}
          {showAddOption && (
            <>
              <div className="px-2 my-1">
                <div className="h-px bg-border" />
              </div>
              <SelectItem value="__add_new__" className="pl-2 [&>span:first-child]:hidden">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Add</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
  );
}