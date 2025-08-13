import { ColorTheme } from '@/types/colorTheme';

/**
 * Enhanced color theme processing utilities for consistent color handling
 * across the application, especially for image generation workflows.
 */

/**
 * Validates if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Ensures a color has a # prefix for hex colors
 */
export function normalizeHexColor(color: string): string {
  if (!color) return color;
  if (isValidHexColor(color) && !color.startsWith('#')) {
    return `#${color}`;
  }
  return color;
}

/**
 * Converts hex color to HSL format for CSS variables
 */
export function hexToHsl(hex: string): string {
  if (!isValidHexColor(hex)) {
    console.warn('Invalid hex color provided:', hex);
    return '0 0% 50%'; // Default gray
  }

  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Validates and normalizes a complete color theme for consistency
 */
export function processColorTheme(theme: ColorTheme): ColorTheme {
  const processed = { ...theme };
  
  // Normalize all color properties
  const colorProperties = [
    'primary_color',
    'secondary_color', 
    'accent_color',
    'background_color',
    'text_color',
    'border_color'
  ] as const;

  colorProperties.forEach(prop => {
    if (processed[prop]) {
      processed[prop] = normalizeHexColor(processed[prop]);
      
      if (!isValidHexColor(processed[prop])) {
        console.warn(`Invalid color in theme ${theme.name} for property ${prop}:`, processed[prop]);
        // Set default color based on property type
        switch (prop) {
          case 'primary_color':
            processed[prop] = '#2563eb';
            break;
          case 'secondary_color':
            processed[prop] = '#64748b';
            break;
          case 'accent_color':
            processed[prop] = '#16a34a';
            break;
          case 'background_color':
            processed[prop] = '#ffffff';
            break;
          case 'text_color':
            processed[prop] = '#1e293b';
            break;
          case 'border_color':
            processed[prop] = '#e2e8f0';
            break;
        }
      }
    }
  });

  return processed;
}

/**
 * Creates CSS custom properties from a color theme
 */
export function generateCSSCustomProperties(theme: ColorTheme): Record<string, string> {
  const processed = processColorTheme(theme);
  
  return {
    '--theme-primary': hexToHsl(processed.primary_color),
    '--theme-secondary': hexToHsl(processed.secondary_color),
    '--theme-accent': hexToHsl(processed.accent_color),
    '--theme-background': hexToHsl(processed.background_color),
    '--theme-text': hexToHsl(processed.text_color),
    '--theme-border': hexToHsl(processed.border_color),
    
    // Raw hex values for image generation
    '--theme-primary-hex': processed.primary_color,
    '--theme-secondary-hex': processed.secondary_color,
    '--theme-accent-hex': processed.accent_color,
    '--theme-background-hex': processed.background_color,
    '--theme-text-hex': processed.text_color,
    '--theme-border-hex': processed.border_color
  };
}

/**
 * Applies a color theme to the document root for immediate CSS variable updates
 */
export function applyColorThemeToDocument(theme: ColorTheme): void {
  const properties = generateCSSCustomProperties(theme);
  const root = document.documentElement;
  
  Object.entries(properties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  console.log('Applied color theme to document:', theme.name, properties);
}

/**
 * Ensures color theme compatibility for image generation
 * Validates and provides fallbacks for AI prompt generation
 */
export function prepareThemeForImageGeneration(theme: ColorTheme | null): ColorTheme | null {
  if (!theme) return null;
  
  const processed = processColorTheme(theme);
  
  // Validate required fields for image generation
  const requiredFields = ['primary_color', 'secondary_color', 'visual_style'];
  const missingFields = requiredFields.filter(field => !processed[field as keyof ColorTheme]);
  
  if (missingFields.length > 0) {
    console.warn('Color theme missing required fields for image generation:', missingFields);
    
    // Provide fallbacks
    if (!processed.visual_style) {
      processed.visual_style = 'modern';
    }
  }
  
  return processed;
}

/**
 * Extracts color palette for AI prompt instructions
 */
export function extractColorPaletteForPrompt(theme: ColorTheme): string {
  const processed = processColorTheme(theme);
  
  const colors = [
    `Primary: ${processed.primary_color}`,
    `Secondary: ${processed.secondary_color}`,
    `Accent: ${processed.accent_color}`,
    `Background: ${processed.background_color}`,
    `Text: ${processed.text_color}`
  ].join(', ');
  
  return `Color palette: ${colors}. Visual style: ${processed.visual_style || 'modern'}.`;
}

/**
 * Validates color theme consistency across all properties
 */
export function validateColorThemeConsistency(theme: ColorTheme): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const processed = processColorTheme(theme);
  
  // Check for contrast issues
  if (processed.text_color === processed.background_color) {
    issues.push('Text and background colors are identical');
    recommendations.push('Ensure sufficient contrast between text and background');
  }
  
  // Check for missing essential colors
  if (!processed.primary_color || !processed.background_color || !processed.text_color) {
    issues.push('Missing essential colors (primary, background, or text)');
    recommendations.push('Define all essential colors for consistent theming');
  }
  
  // Check visual style consistency
  if (!processed.visual_style) {
    issues.push('Missing visual style definition');
    recommendations.push('Define a visual style (modern, minimalist, etc.) for AI generation');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}