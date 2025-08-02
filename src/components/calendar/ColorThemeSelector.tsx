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
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
        Color Theme
      </label>
      <Select value={selectedThemeId || ""} onValueChange={onThemeChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <SelectValue placeholder="Select color theme">
              {selectedTheme && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border border-border" 
                      style={{ backgroundColor: selectedTheme.primary_color }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-border" 
                      style={{ backgroundColor: selectedTheme.secondary_color }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-border" 
                      style={{ backgroundColor: selectedTheme.accent_color }}
                    />
                  </div>
                  <span>{selectedTheme.name}</span>
                  {selectedTheme.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <div className="flex items-center gap-3 w-full">
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: theme.secondary_color }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: theme.accent_color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{theme.name}</span>
                    {theme.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                    {theme.is_default && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {theme.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {theme.description}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}