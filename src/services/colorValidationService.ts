/**
 * Color Validation Service
 * 
 * Provides comprehensive color validation, accessibility checks,
 * and safe color manipulation for real-time color updates.
 */

interface ColorValidationResult {
  isValid: boolean;
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'css-var' | 'unknown';
  errors: string[];
  warnings: string[];
  normalizedValue?: string;
  accessibility?: {
    contrastRatio?: number;
    wcagLevel?: 'AA' | 'AAA' | 'fail';
    isReadable?: boolean;
  };
}

interface ColorConversionOptions {
  format: 'hex' | 'rgb' | 'hsl' | 'css-hsl';
  preserveAlpha?: boolean;
}

class ColorValidationService {
  private readonly COLOR_FORMATS = {
    hex: /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/,
    rgb: /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
    rgba: /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(0|1|0?\.\d+)\s*\)$/,
    hsl: /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/,
    hsla: /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
    cssHsl: /^(\d+)\s+(\d+)%\s+(\d+)%$/,
    cssHsla: /^(\d+)\s+(\d+)%\s+(\d+)%\s*\/\s*(0|1|0?\.\d+)$/,
  };

  private readonly SAFE_COLOR_RANGES = {
    hue: { min: 0, max: 360 },
    saturation: { min: 0, max: 100 },
    lightness: { min: 5, max: 95 }, // Avoid pure black/white for accessibility
    rgb: { min: 0, max: 255 },
    alpha: { min: 0, max: 1 },
  };

  /**
   * Validates a color value comprehensively
   */
  validateColor(
    value: string, 
    context?: { property?: string; backgroundColor?: string }
  ): ColorValidationResult {
    const result: ColorValidationResult = {
      isValid: false,
      format: 'unknown',
      errors: [],
      warnings: [],
    };

    if (!value || typeof value !== 'string') {
      result.errors.push('Color value is required and must be a string');
      return result;
    }

    const trimmedValue = value.trim();
    
    // Check each format
    for (const [formatName, regex] of Object.entries(this.COLOR_FORMATS)) {
      const match = trimmedValue.match(regex);
      if (match) {
        result.format = formatName as any;
        result.isValid = true;
        
        // Format-specific validation
        const formatValidation = this.validateColorFormat(formatName, match, trimmedValue);
        result.errors.push(...formatValidation.errors);
        result.warnings.push(...formatValidation.warnings);
        result.normalizedValue = formatValidation.normalizedValue;
        
        // Only proceed with accessibility if no format errors
        if (formatValidation.errors.length === 0) {
          // Accessibility validation
          if (context?.backgroundColor) {
            result.accessibility = this.validateAccessibility(
              trimmedValue, 
              context.backgroundColor
            );
          }
          
          // Context-specific warnings
          if (context?.property) {
            result.warnings.push(...this.getContextualWarnings(
              context.property, 
              trimmedValue
            ));
          }
        }
        
        break;
      }
    }

    if (!result.isValid) {
      result.errors.push('Unrecognized color format. Use hex (#ffffff), rgb(255,255,255), hsl(0,0%,100%), or CSS HSL (210 11% 15%)');
    }

    return result;
  }

  /**
   * Validates format-specific color constraints
   */
  private validateColorFormat(
    format: string, 
    match: RegExpMatchArray, 
    originalValue: string
  ): { errors: string[]; warnings: string[]; normalizedValue?: string } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let normalizedValue = originalValue;

    switch (format) {
      case 'hex':
        const hexValidation = this.validateHexColor(match[1]);
        errors.push(...hexValidation.errors);
        warnings.push(...hexValidation.warnings);
        normalizedValue = hexValidation.normalized;
        break;

      case 'rgb':
      case 'rgba':
        const rgbValues = [
          parseInt(match[1]), 
          parseInt(match[2]), 
          parseInt(match[3])
        ];
        const alpha = format === 'rgba' ? parseFloat(match[4]) : 1;
        
        const rgbValidation = this.validateRgbValues(rgbValues, alpha);
        errors.push(...rgbValidation.errors);
        warnings.push(...rgbValidation.warnings);
        break;

      case 'hsl':
      case 'hsla':
      case 'cssHsl':
      case 'cssHsla':
        const hue = parseInt(match[1]);
        const saturation = parseInt(match[2]);
        const lightness = parseInt(match[3]);
        const hslAlpha = ['hsla', 'cssHsla'].includes(format) ? parseFloat(match[4]) : 1;
        
        const hslValidation = this.validateHslValues(hue, saturation, lightness, hslAlpha);
        errors.push(...hslValidation.errors);
        warnings.push(...hslValidation.warnings);
        
        // Normalize CSS HSL format
        if (['cssHsl', 'cssHsla'].includes(format)) {
          normalizedValue = `${hue} ${saturation}% ${lightness}%`;
          if (format === 'cssHsla') {
            normalizedValue += ` / ${hslAlpha}`;
          }
        }
        break;
    }

    return { errors, warnings, normalizedValue };
  }

  /**
   * Validates hex color values
   */
  private validateHexColor(hex: string): { errors: string[]; warnings: string[]; normalized: string } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let normalized = `#${hex}`;

    // Expand 3-character hex to 6-character
    if (hex.length === 3) {
      normalized = `#${hex.split('').map(c => c + c).join('')}`;
      warnings.push('3-character hex expanded to 6-character for consistency');
    }

    // Check for common mistakes
    if (hex.toLowerCase() === 'ffffff') {
      warnings.push('Pure white may cause accessibility issues');
    } else if (hex.toLowerCase() === '000000') {
      warnings.push('Pure black may cause accessibility issues');
    }

    return { errors, warnings, normalized };
  }

  /**
   * Validates RGB color values
   */
  private validateRgbValues(
    rgb: number[], 
    alpha: number
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate RGB ranges
    rgb.forEach((value, index) => {
      const channel = ['red', 'green', 'blue'][index];
      if (value < this.SAFE_COLOR_RANGES.rgb.min || value > this.SAFE_COLOR_RANGES.rgb.max) {
        errors.push(`${channel} value ${value} must be between 0 and 255`);
      }
    });

    // Validate alpha
    if (alpha < this.SAFE_COLOR_RANGES.alpha.min || alpha > this.SAFE_COLOR_RANGES.alpha.max) {
      errors.push(`Alpha value ${alpha} must be between 0 and 1`);
    }

    // Accessibility warnings
    const [r, g, b] = rgb;
    if (r === g && g === b) {
      if (r < 50) warnings.push('Very dark colors may affect readability');
      if (r > 200) warnings.push('Very light colors may affect readability');
    }

    return { errors, warnings };
  }

  /**
   * Validates HSL color values
   */
  private validateHslValues(
    hue: number, 
    saturation: number, 
    lightness: number, 
    alpha: number
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate ranges
    if (hue < 0 || hue > 360) {
      errors.push(`Hue value ${hue} must be between 0 and 360`);
    }
    
    if (saturation < 0 || saturation > 100) {
      errors.push(`Saturation value ${saturation}% must be between 0% and 100%`);
    }
    
    if (lightness < 0 || lightness > 100) {
      errors.push(`Lightness value ${lightness}% must be between 0% and 100%`);
    }
    
    if (alpha < 0 || alpha > 1) {
      errors.push(`Alpha value ${alpha} must be between 0 and 1`);
    }

    // Accessibility warnings
    if (lightness < this.SAFE_COLOR_RANGES.lightness.min) {
      warnings.push('Very dark colors may affect accessibility');
    }
    
    if (lightness > this.SAFE_COLOR_RANGES.lightness.max) {
      warnings.push('Very light colors may affect accessibility');
    }

    if (saturation === 0) {
      warnings.push('Zero saturation creates grayscale - ensure sufficient contrast');
    }

    return { errors, warnings };
  }

  /**
   * Validates color accessibility and contrast
   */
  private validateAccessibility(
    foreground: string, 
    background: string
  ): ColorValidationResult['accessibility'] {
    try {
      // Convert colors to RGB for contrast calculation
      const fgRgb = this.toRgb(foreground);
      const bgRgb = this.toRgb(background);
      
      if (!fgRgb || !bgRgb) {
        return {
          isReadable: false,
          wcagLevel: 'fail',
        };
      }

      const contrastRatio = this.calculateContrastRatio(fgRgb, bgRgb);
      
      return {
        contrastRatio,
        wcagLevel: contrastRatio >= 7 ? 'AAA' : contrastRatio >= 4.5 ? 'AA' : 'fail',
        isReadable: contrastRatio >= 4.5,
      };
    } catch (error) {
      console.warn('Error calculating accessibility:', error);
      return {
        isReadable: false,
        wcagLevel: 'fail',
      };
    }
  }

  /**
   * Gets contextual warnings based on CSS property
   */
  private getContextualWarnings(property: string, value: string): string[] {
    const warnings: string[] = [];

    if (property.includes('background') && value.includes('transparent')) {
      warnings.push('Transparent backgrounds may cause readability issues');
    }

    if (property.includes('text') || property.includes('foreground')) {
      if (value.includes('white') || value.includes('#fff')) {
        warnings.push('White text requires dark background for readability');
      }
    }

    return warnings;
  }

  /**
   * Converts color to RGB values
   */
  private toRgb(color: string): [number, number, number] | null {
    // This is a simplified implementation
    // In practice, you'd want a more robust color parsing library
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16),
      ];
    }
    return null;
  }

  /**
   * Calculates WCAG contrast ratio
   */
  private calculateContrastRatio(
    rgb1: [number, number, number], 
    rgb2: [number, number, number]
  ): number {
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculates relative luminance
   */
  private getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Safely applies a batch of color changes
   */
  async validateColorBatch(
    colors: Record<string, string>,
    context?: { backgrounds?: Record<string, string> }
  ): Promise<{
    valid: Record<string, string>;
    invalid: Record<string, ColorValidationResult>;
    warnings: string[];
  }> {
    const valid: Record<string, string> = {};
    const invalid: Record<string, ColorValidationResult> = {};
    const warnings: string[] = [];

    for (const [property, value] of Object.entries(colors)) {
      const validation = this.validateColor(value, {
        property,
        backgroundColor: context?.backgrounds?.[property]
      });

      if (validation.isValid && validation.errors.length === 0) {
        valid[property] = validation.normalizedValue || value;
      } else {
        invalid[property] = validation;
      }

      warnings.push(...validation.warnings);
    }

    return { valid, invalid, warnings };
  }
}

export const colorValidationService = new ColorValidationService();