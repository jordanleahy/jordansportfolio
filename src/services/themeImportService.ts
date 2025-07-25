import { supabase } from "@/integrations/supabase/client";
import type { ThemeImportData, ThemePost, ValidationResult, ProcessingResult } from "@/types/themeImport";

export class ThemeImportService {
  private readonly MAX_POSTS_PER_IMPORT = 100;
  private readonly ALLOWED_STATUSES = ['draft', 'scheduled', 'published'] as const;

  /**
   * Validates and cleans JSON data before import
   */
  validateThemeData(rawData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Parse if string
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      
      // Validate required fields
      if (!data.category || typeof data.category !== 'string') {
        errors.push('Category is required and must be a string');
      }
      
      if (!data.theme || typeof data.theme !== 'string') {
        errors.push('Theme is required and must be a string');
      }
      
      if (!Array.isArray(data.posts)) {
        errors.push('Posts must be an array');
        return { isValid: false, errors, warnings };
      }
      
      if (data.posts.length > this.MAX_POSTS_PER_IMPORT) {
        errors.push(`Too many posts. Maximum allowed: ${this.MAX_POSTS_PER_IMPORT}`);
      }
      
      if (data.posts.length === 0) {
        errors.push('At least one post is required');
      }
      
      // Clean and validate posts
      const cleanedPosts: ThemePost[] = [];
      
      data.posts.forEach((post: any, index: number) => {
        const postErrors: string[] = [];
        
        if (!post.title || typeof post.title !== 'string') {
          postErrors.push(`Post ${index + 1}: Title is required`);
        }
        
        if (!post.description || typeof post.description !== 'string') {
          postErrors.push(`Post ${index + 1}: Description is required`);
        }
        
        // Validate day if provided
        if (post.day !== undefined) {
          const dayNum = Number(post.day);
          if (isNaN(dayNum) || dayNum < 1 || dayNum > 365) {
            warnings.push(`Post ${index + 1}: Invalid day value, removing`);
            delete post.day;
          } else {
            post.day = dayNum;
          }
        }
        
        // Clean status
        if (post.status && !this.ALLOWED_STATUSES.includes(post.status)) {
          warnings.push(`Post ${index + 1}: Invalid status '${post.status}', defaulting to 'draft'`);
          post.status = 'draft';
        }
        
        if (postErrors.length === 0) {
          cleanedPosts.push({
            title: this.sanitizeText(post.title),
            description: this.sanitizeText(post.description),
            day: post.day,
            theme: data.theme,
            status: post.status || 'draft'
          });
        } else {
          errors.push(...postErrors);
        }
      });
      
      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }
      
      const cleanedData: ThemeImportData = {
        category: this.sanitizeText(data.category),
        theme: this.sanitizeText(data.theme),
        description: data.description ? this.sanitizeText(data.description) : undefined,
        posts: cleanedPosts
      };
      
      return {
        isValid: true,
        errors: [],
        warnings,
        cleanedData
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Safely imports theme data after validation
   */
  async importThemeData(rawData: any): Promise<ProcessingResult> {
    try {
      const validation = this.validateThemeData(rawData);
      
      if (!validation.isValid || !validation.cleanedData) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }
      
      // Check for duplicate categories
      const existingCategories = await this.getExistingCategories();
      if (existingCategories.includes(validation.cleanedData.category)) {
        return {
          success: false,
          errors: [`Category '${validation.cleanedData.category}' already exists. Use a different category name.`],
          warnings: validation.warnings
        };
      }
      
      // Import data using the existing database function
      const insertedCount = await this.bulkInsertPosts(
        validation.cleanedData.category,
        validation.cleanedData.posts
      );
      
      return {
        success: true,
        insertedCount,
        errors: [],
        warnings: validation.warnings,
        cleanedData: validation.cleanedData
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Preview what would be imported without actually importing
   */
  async previewImport(rawData: any): Promise<ValidationResult> {
    return this.validateThemeData(rawData);
  }

  /**
   * Process theme data using AI for cleaning and enhancement
   */
  async processWithAI(rawData: any): Promise<ProcessingResult> {
    try {
      const response = await supabase.functions.invoke('process-theme-json', {
        body: { rawJson: rawData }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getExistingCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('category');

    if (error) throw error;
    
    return [...new Set((data || []).map((item: any) => item.category as string))].filter(Boolean);
  }

  private async bulkInsertPosts(category: string, posts: ThemePost[]): Promise<number> {
    const { data, error } = await supabase
      .rpc('insert_category_content', {
        category_name: category,
        posts_data: posts as any
      });

    if (error) throw error;
    return data || 0;
  }

  private sanitizeText(text: string): string {
    // Remove potential HTML/script tags and normalize whitespace
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Cleanup agent - removes invalid or corrupted data
   */
  async runCleanupAgent(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleanedCount = 0;

    try {
      // Find posts with invalid data
      const { data: posts, error } = await supabase
        .from('social_media_posts')
        .select('id, title, description, category, theme')
        .or('title.is.null,description.is.null,title.eq.,description.eq.');

      if (error) throw error;

      if (posts && posts.length > 0) {
        // Delete posts with null/empty critical fields
        const idsToDelete = posts.map(post => post.id);
        const { error: deleteError } = await supabase
          .from('social_media_posts')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          errors.push(`Failed to delete invalid posts: ${deleteError.message}`);
        } else {
          cleanedCount = posts.length;
        }
      }

      return { cleaned: cleanedCount, errors };
    } catch (error) {
      return {
        cleaned: 0,
        errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

export const themeImportService = new ThemeImportService();