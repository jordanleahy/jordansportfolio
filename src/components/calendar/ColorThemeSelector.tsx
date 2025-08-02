import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { ColorTheme } from "@/types/colorTheme";
import { useRealtimeColorThemes } from '@/hooks/useRealtimeColorThemes';

interface ColorThemeSelectorProps {
  themes: ColorTheme[];
  selectedThemeId?: string;
  onThemeChange: (themeId: string) => void;
  className?: string;
}

export function ColorThemeSelector({ 
  themes, 
  selectedThemeId, 
  onThemeChange, 
  className 
}: ColorThemeSelectorProps) {
  const selectedTheme = themes.find(t => t.id === selectedThemeId);

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

  return (
    <Select value={selectedThemeId || ""} onValueChange={onThemeChange}>
        <SelectTrigger className="h-8 w-fit border border-input bg-background px-2 py-1 text-xs sm:text-sm [&>svg]:hidden">
          <div className="flex gap-1">
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: selectedTheme?.primary_color || '#3b82f6' }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: selectedTheme?.secondary_color || '#10b981' }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: selectedTheme?.accent_color || '#8b5cf6' }}
            />
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-border" 
              style={{ backgroundColor: selectedTheme?.background_color || '#f97316' }}
            />
          </div>
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)]">
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
        </SelectContent>
      </Select>
  );
}