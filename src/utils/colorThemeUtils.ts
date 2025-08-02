import { ColorTheme } from '@/types/colorTheme';

/**
 * Maps color theme properties to their names for easy reference
 */
export const COLOR_PROPERTY_NAMES = {
  primary_color: 'primary',
  secondary_color: 'secondary', 
  accent_color: 'accent',
  background_color: 'background',
  text_color: 'text',
  border_color: 'border'
} as const;

/**
 * Extracts hex color codes from a ColorTheme
 */
export function extractThemeColors(theme: ColorTheme): Record<string, string> {
  return {
    primary_color: theme.primary_color,
    secondary_color: theme.secondary_color,
    accent_color: theme.accent_color,
    background_color: theme.background_color,
    text_color: theme.text_color,
    border_color: theme.border_color
  };
}

/**
 * Normalizes hex color codes (removes # and converts to lowercase)
 */
export function normalizeHexColor(color: string): string {
  return color.replace('#', '').toLowerCase();
}

/**
 * Creates a mapping between old theme colors and new theme colors
 */
export function createColorMapping(oldTheme: ColorTheme | null, newTheme: ColorTheme): Map<string, string> {
  const mapping = new Map<string, string>();
  
  if (!oldTheme) return mapping;
  
  const oldColors = extractThemeColors(oldTheme);
  const newColors = extractThemeColors(newTheme);
  
  // Map each color property from old to new
  Object.keys(oldColors).forEach(key => {
    const oldColor = oldColors[key as keyof typeof oldColors];
    const newColor = newColors[key as keyof typeof newColors];
    
    if (oldColor && newColor) {
      // Store both with and without # for flexible matching
      mapping.set(oldColor.toLowerCase(), newColor);
      mapping.set(normalizeHexColor(oldColor), normalizeHexColor(newColor));
      mapping.set(oldColor.toLowerCase(), newColor);
    }
  });
  
  return mapping;
}

/**
 * Replaces hex color codes in text content based on a color mapping
 */
export function replaceHexColorsInText(
  text: string, 
  colorMapping: Map<string, string>
): string {
  if (!text || colorMapping.size === 0) return text;
  
  // Regex to match hex color codes with or without #
  const hexColorRegex = /#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g;
  
  return text.replace(hexColorRegex, (match) => {
    const normalizedMatch = match.toLowerCase();
    const withoutHash = normalizeHexColor(match);
    
    // Try to find a replacement
    let replacement = colorMapping.get(normalizedMatch) || colorMapping.get(withoutHash);
    
    if (replacement) {
      // Ensure replacement has # if original had #
      if (match.startsWith('#') && !replacement.startsWith('#')) {
        replacement = '#' + replacement;
      } else if (!match.startsWith('#') && replacement.startsWith('#')) {
        replacement = replacement.substring(1);
      }
      return replacement;
    }
    
    return match; // Return original if no mapping found
  });
}

/**
 * Main function to update text content when theme changes
 */
export function updateTextWithNewTheme(
  text: string,
  oldTheme: ColorTheme | null,
  newTheme: ColorTheme
): string {
  if (!oldTheme || !newTheme || oldTheme.id === newTheme.id) {
    return text;
  }
  
  const colorMapping = createColorMapping(oldTheme, newTheme);
  return replaceHexColorsInText(text, colorMapping);
}