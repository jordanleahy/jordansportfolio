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
    <div className={className}>
      <Select value={selectedThemeId || ""} onValueChange={onThemeChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <SelectValue placeholder="Select color theme">
              {selectedTheme && (
                <div className="flex gap-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: selectedTheme.primary_color }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: selectedTheme.secondary_color }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: selectedTheme.accent_color }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: selectedTheme.background_color }}
                  />
                </div>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.primary_color }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.secondary_color }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.accent_color }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border" 
                  style={{ backgroundColor: theme.background_color }}
                />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}