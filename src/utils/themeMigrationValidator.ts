// Runtime validation utility for theme migration compliance

import { isValidThemeId, ThemeValidationError } from '@/types/stories/validation';

/**
 * Development-time validator to catch legacy theme name usage
 * This helps enforce the migration from theme names to theme IDs
 */
export class ThemeMigrationValidator {
  private static warnings = new Set<string>();

  /**
   * Validate that a value is a proper theme ID, not a legacy theme name
   */
  static validateThemeIdentifier(value: string, context: string): string {
    if (!value) {
      throw new ThemeValidationError(
        `Theme identifier is required in ${context}`,
        'INVALID_THEME_ID',
        { value, context }
      );
    }

    if (!isValidThemeId(value)) {
      // Check if this looks like a legacy theme name
      if (this.isLikelyThemeName(value)) {
        throw new ThemeValidationError(
          `Legacy theme name detected in ${context}: "${value}". Please use theme ID instead.`,
          'LEGACY_THEME_NAME_USAGE',
          { value, context }
        );
      }

      // If it's not a valid UUID but doesn't look like a theme name, warn once
      const warningKey = `${context}:${value}`;
      if (!this.warnings.has(warningKey)) {
        console.warn(`⚠️ Potentially invalid theme ID in ${context}: ${value}`);
        this.warnings.add(warningKey);
      }
    }

    return value;
  }

  /**
   * Check if a string looks like a legacy theme name
   */
  private static isLikelyThemeName(value: string): boolean {
    // Common patterns for theme names
    return (
      value.includes('_') ||           // snake_case names
      value.includes(' ') ||           // spaces in names
      value.includes('-') ||           // kebab-case names
      /^[a-zA-Z]/.test(value) ||      // starts with letter
      value.length > 50 ||             // very long names
      /^(technology|cdi|general|startup|business|marketing)/.test(value.toLowerCase()) // category prefixes
    );
  }

  /**
   * Validate theme objects to ensure they use IDs consistently
   */
  static validateThemeObject(theme: any, context: string): void {
    if (!theme) {
      return;
    }

    if (theme.id) {
      this.validateThemeIdentifier(theme.id, `${context}.id`);
    }

    if (theme.theme_id) {
      this.validateThemeIdentifier(theme.theme_id, `${context}.theme_id`);
    }

    if (theme.themeId) {
      this.validateThemeIdentifier(theme.themeId, `${context}.themeId`);
    }
  }

  /**
   * Validate route parameters for theme consistency
   */
  static validateRouteParams(params: Record<string, string>, context: string): void {
    if (params.themeId) {
      this.validateThemeIdentifier(params.themeId, `${context}.route.themeId`);
    }

    // Detect legacy route patterns
    if (params.themeName || params.theme) {
      throw new ThemeValidationError(
        `Legacy theme name route parameter detected in ${context}. Use themeId instead.`,
        'LEGACY_THEME_NAME_USAGE',
        { params, context }
      );
    }
  }

  /**
   * Clear recorded warnings (useful for testing)
   */
  static clearWarnings(): void {
    this.warnings.clear();
  }

  /**
   * Get current warnings count
   */
  static getWarningsCount(): number {
    return this.warnings.size;
  }
}

// Development helper function for quick validation
export function validateThemeId(themeId: string, context = 'unknown'): string {
  return ThemeMigrationValidator.validateThemeIdentifier(themeId, context);
}

// Development helper function for theme objects
export function validateTheme(theme: any, context = 'unknown'): void {
  ThemeMigrationValidator.validateThemeObject(theme, context);
}

// Development helper function for route params
export function validateRouteParams(params: Record<string, string>, context = 'unknown'): void {
  ThemeMigrationValidator.validateRouteParams(params, context);
}