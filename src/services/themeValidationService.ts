import { z } from 'zod';
import { ThemeImportDataSchema, type ThemeImportData, type ProcessingResult, type ValidationError } from '@/types/themeImportStrict';

export class ThemeValidationService {
  private static readonly MAX_POSTS_PER_IMPORT = 100;

  /**
   * Validates theme data using Zod schema with detailed error reporting
   */
  static validateThemeData(rawData: unknown): ProcessingResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: string[] = [];

    try {
      // Pre-validation cleaning
      const cleanedData = this.preCleanData(rawData, warnings, fixes);
      
      // Validate with Zod
      const result = ThemeImportDataSchema.safeParse(cleanedData);
      
      if (!result.success) {
        const validationErrors = this.formatZodErrors(result.error);
        errors.push(...validationErrors);
        return { success: false, errors, warnings, fixes };
      }

      // Post-validation checks
      const finalData = this.postValidationChecks(result.data, warnings, fixes);

      return {
        success: true,
        data: finalData,
        errors: [],
        warnings,
        fixes,
      };
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors, warnings, fixes };
    }
  }

  /**
   * Pre-cleans data before Zod validation
   */
  private static preCleanData(rawData: unknown, warnings: string[], fixes: string[]): unknown {
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
        fixes.push('Parsed JSON string input');
      } catch {
        throw new Error('Invalid JSON format');
      }
    }

    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Input must be an object');
    }

    const data = { ...rawData } as Record<string, unknown>;

    // Clean category
    if (typeof data.category === 'string') {
      const originalCategory = data.category;
      data.category = this.sanitizeText(data.category).toLowerCase().replace(/\s+/g, '-');
      if (data.category !== originalCategory) {
        fixes.push('Normalized category name');
      }
    }

    // Clean theme
    if (typeof data.theme === 'string') {
      data.theme = this.sanitizeText(data.theme);
    }

    // Clean description
    if (data.description && typeof data.description === 'string') {
      data.description = this.sanitizeText(data.description);
    }

    // Clean posts array
    if (Array.isArray(data.posts)) {
      data.posts = data.posts
        .filter((post) => post && typeof post === 'object')
        .map((post, index) => this.cleanPost(post as Record<string, unknown>, index, warnings, fixes));
    }

    return data;
  }

  /**
   * Cleans individual post data
   */
  private static cleanPost(
    post: Record<string, unknown>,
    index: number,
    warnings: string[],
    fixes: string[]
  ): Record<string, unknown> {
    const cleaned = { ...post };

    // Clean title
    if (typeof cleaned.title === 'string') {
      cleaned.title = this.sanitizeText(cleaned.title);
    }

    // Clean description
    if (typeof cleaned.description === 'string') {
      cleaned.description = this.sanitizeText(cleaned.description);
    }

    // Normalize day
    if (cleaned.day !== undefined) {
      const day = Number(cleaned.day);
      if (isNaN(day) || day < 1 || day > 365) {
        delete cleaned.day;
        warnings.push(`Post ${index + 1}: Invalid day value removed`);
      } else {
        cleaned.day = Math.floor(day);
      }
    }

    // Normalize status
    const validStatuses = ['draft', 'scheduled', 'published'];
    if (cleaned.status && !validStatuses.includes(cleaned.status as string)) {
      cleaned.status = 'draft';
      warnings.push(`Post ${index + 1}: Invalid status, defaulted to 'draft'`);
    }

    return cleaned;
  }

  /**
   * Post-validation additional checks
   */
  private static postValidationChecks(
    data: ThemeImportData,
    warnings: string[],
    fixes: string[]
  ): ThemeImportData {
    // Check for duplicate post titles
    const titleCounts = new Map<string, number>();
    data.posts.forEach((post) => {
      const count = titleCounts.get(post.title) || 0;
      titleCounts.set(post.title, count + 1);
    });

    titleCounts.forEach((count, title) => {
      if (count > 1) {
        warnings.push(`Duplicate post title found: "${title}"`);
      }
    });

    // Check for sequential day numbers if days are provided
    const postsWithDays = data.posts.filter((post) => post.day !== undefined);
    if (postsWithDays.length > 1) {
      const days = postsWithDays.map((post) => post.day!).sort((a, b) => a - b);
      const gaps = days.slice(1).some((day, index) => day - days[index] > 7);
      if (gaps) {
        warnings.push('Large gaps detected in day numbering');
      }
    }

    return data;
  }

  /**
   * Formats Zod validation errors into readable messages
   */
  private static formatZodErrors(error: z.ZodError): string[] {
    return error.issues.map((err) => {
      const path = err.path.length > 0 ? ` at ${err.path.join('.')}` : '';
      return `${err.message}${path}`;
    });
  }

  /**
   * Sanitizes text by removing HTML and normalizing whitespace
   */
  private static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Validates if a category name is available
   */
  static validateCategoryName(category: string, existingCategories: readonly string[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (existingCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: `Category '${category}' already exists`,
        code: 'DUPLICATE_CATEGORY',
      });
    }

    if (category.length < 3) {
      errors.push({
        field: 'category',
        message: 'Category name must be at least 3 characters',
        code: 'CATEGORY_TOO_SHORT',
      });
    }

    return errors;
  }
}