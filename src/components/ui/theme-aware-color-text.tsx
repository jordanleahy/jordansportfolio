import React, { useMemo } from 'react';
import { ColorTheme } from '@/types/colorTheme';

interface ThemeAwareColorTextProps {
  text: string;
  className?: string;
  currentTheme?: ColorTheme;
}

export function ThemeAwareColorText({ text, className = '', currentTheme }: ThemeAwareColorTextProps) {
  // Regex to match hex color codes (3, 4, 6, or 8 characters)
  const hexColorRegex = /#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})\b/g;
  
  // Map common design system colors to theme properties
  const getThemeColorMapping = (hexCode: string): string => {
    if (!currentTheme) return hexCode;
    
    const hex = hexCode.toLowerCase();
    
    // Map common blue shades to primary
    if (hex.includes('2563eb') || hex.includes('3b82f6') || hex.includes('1d4ed8') || 
        hex.includes('blue') || hex.startsWith('#1e') || hex.startsWith('#25')) {
      return currentTheme.primary_color;
    }
    
    // Map common teal/cyan shades to secondary  
    if (hex.includes('0891b2') || hex.includes('0284c7') || hex.includes('06b6d4') ||
        hex.includes('teal') || hex.includes('cyan') || hex.startsWith('#08') || hex.startsWith('#02')) {
      return currentTheme.secondary_color;
    }
    
    // Map green shades to accent
    if (hex.includes('16a34a') || hex.includes('22c55e') || hex.includes('15803d') ||
        hex.includes('green') || hex.startsWith('#16') || hex.startsWith('#22')) {
      return currentTheme.accent_color;
    }
    
    // Map gray shades to text color
    if (hex.includes('6b7280') || hex.includes('374151') || hex.includes('gray') ||
        hex.startsWith('#6b') || hex.startsWith('#37')) {
      return currentTheme.text_color;
    }
    
    // Map light grays to background
    if (hex.includes('f3f4f6') || hex.includes('e5e7eb') || hex.includes('white') ||
        hex.startsWith('#f3') || hex.startsWith('#e5')) {
      return currentTheme.background_color;
    }
    
    // Default: return original color
    return hexCode;
  };
  
  const renderTextWithThemeColors = useMemo(() => {
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Reset regex lastIndex to ensure proper matching
    hexColorRegex.lastIndex = 0;
    
    while ((match = hexColorRegex.exec(text)) !== null) {
      // Add text before the hex code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add the hex code with theme-aware color swatch
      const originalHex = match[0];
      const themeColor = getThemeColorMapping(originalHex);
      
      parts.push(
        <span key={`${match.index}-${originalHex}`} className="inline-flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded border border-border/50 flex-shrink-0 transition-colors duration-200"
            style={{ backgroundColor: themeColor }}
            title={`Original: ${originalHex} → Theme: ${themeColor}`}
          />
          <span className="font-mono text-sm transition-colors duration-200" style={{ color: themeColor }}>
            {originalHex}
          </span>
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  }, [text, currentTheme]);

  return (
    <div className={`whitespace-pre-wrap transition-colors duration-200 ${className}`}>
      {renderTextWithThemeColors}
    </div>
  );
}