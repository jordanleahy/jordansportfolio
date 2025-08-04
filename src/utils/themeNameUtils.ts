/**
 * Utility functions for standardizing theme names across the application
 * to ensure consistent naming between generation, storage, and real-time updates
 */

/**
 * Normalizes a theme name to ensure consistency across the pipeline
 * Rules:
 * - Trim whitespace
 * - Normalize unicode characters
 * - Preserve case and spacing for readability
 */
export const normalizeThemeName = (themeName: string): string => {
  if (!themeName) return '';
  
  return themeName
    .trim()
    .normalize('NFD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
};

/**
 * Creates a consistent theme identifier for shimmer tracking
 * This ensures the same identifier is used across generation, storage, and removal
 */
export const createThemeIdentifier = (themeName: string): string => {
  return normalizeThemeName(themeName);
};

/**
 * Extracts theme name from database posts for consistent mapping
 * Fallback order: theme -> theme_description -> category
 */
export const extractThemeFromPost = (post: any): string => {
  const theme = post.theme || post.theme_description || post.category || '';
  return normalizeThemeName(theme);
};

/**
 * Validates theme name format and provides suggestions if invalid
 */
export const validateThemeName = (themeName: string): { 
  isValid: boolean; 
  normalized: string; 
  suggestions?: string[] 
} => {
  const normalized = normalizeThemeName(themeName);
  
  if (!normalized) {
    return {
      isValid: false,
      normalized: '',
      suggestions: ['Theme name cannot be empty']
    };
  }
  
  if (normalized.length > 200) {
    return {
      isValid: false,
      normalized: normalized.substring(0, 200),
      suggestions: ['Theme name should be under 200 characters']
    };
  }
  
  return {
    isValid: true,
    normalized
  };
};

/**
 * Debug utility to log theme name transformations
 */
export const debugThemeMapping = (
  context: string, 
  originalName: string, 
  normalizedName: string
): void => {
  if (originalName !== normalizedName) {
    console.log(`🔄 [ThemeMapping] ${context}:`, {
      original: originalName,
      normalized: normalizedName,
      changed: true
    });
  } else {
    console.log(`✅ [ThemeMapping] ${context}:`, {
      theme: normalizedName,
      changed: false
    });
  }
};