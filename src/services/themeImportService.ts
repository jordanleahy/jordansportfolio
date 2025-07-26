import { supabase } from "@/integrations/supabase/client";
import type { ThemeImportData, ThemePost, ProcessingResult } from "@/types/themeImport";

export class ThemeImportService {
  private readonly MAX_POSTS_PER_IMPORT = 100;
  private readonly ALLOWED_STATUSES = ['draft', 'scheduled', 'published'] as const;

  /**
   * Validates and cleans JSON data before import
   */
  validateThemeData(rawData: any): ProcessingResult {
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
        return { success: false, errors, warnings };
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
            status: post.status || 'draft'
          });
        } else {
          errors.push(...postErrors);
        }
      });
      
      if (errors.length > 0) {
        return { success: false, errors, warnings };
      }
      
      const cleanedData: ThemeImportData = {
        category: this.sanitizeText(data.category),
        theme: this.sanitizeText(data.theme),
        description: data.description ? this.sanitizeText(data.description) : undefined,
        posts: cleanedPosts
      };
      
      return {
        success: true,
        errors: [],
        warnings,
        cleanedData
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Safely imports theme data after validation
   */
  async importThemeData(rawData: any): Promise<ProcessingResult> {
    console.log('📦 ThemeImportService: Starting import');
    console.log('📊 Import data type:', typeof rawData);
    console.log('📋 Import data preview:', JSON.stringify(rawData, null, 2).substring(0, 300));
    
    try {
      console.log('✅ Validating theme data...');
      const validation = this.validateThemeData(rawData);
      console.log('📊 Validation result:', validation);
      
      if (!validation.success || !validation.cleanedData) {
        console.error('❌ Validation failed:', validation.errors);
        return validation;
      }
      
      console.log('🔍 Checking for duplicate categories...');
      // Check for duplicate categories
      const existingCategories = await this.getExistingCategories();
      console.log('📋 Existing categories:', existingCategories);
      console.log('🆕 New category:', validation.cleanedData.category);
      
      if (existingCategories.includes(validation.cleanedData.category)) {
        console.warn('⚠️ Category already exists');
        return {
          success: false,
          errors: [`Category '${validation.cleanedData.category}' already exists. Use a different category name.`],
          warnings: validation.warnings
        };
      }
      
      console.log('💾 Starting bulk insert...');
      // Import data using the existing database function
      const insertedCount = await this.bulkInsertPosts(
        validation.cleanedData.category,
        validation.cleanedData.posts
      );
      
      console.log('🎉 Import completed successfully, inserted:', insertedCount);
      
      return {
        success: true,
        insertedCount,
        errors: [],
        warnings: validation.warnings,
        cleanedData: validation.cleanedData
      };
      
    } catch (error) {
      console.error('💥 Import failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
  async previewImport(rawData: any): Promise<ProcessingResult> {
    return this.validateThemeData(rawData);
  }

  /**
   * Process theme data using AI for cleaning and enhancement
   */
  async processWithAI(rawData: any): Promise<ProcessingResult> {
    console.log('🤖 ThemeImportService: Starting AI processing');
    console.log('📊 Input data type:', typeof rawData);
    console.log('📋 Input data preview:', JSON.stringify(rawData, null, 2).substring(0, 500));
    
    try {
      console.log('🔗 Calling Supabase edge function: process-theme-json');
      
      const response = await supabase.functions.invoke('process-theme-json', {
        body: { rawJson: rawData }
      });

      console.log('📥 Edge function response:', response);
      console.log('❌ Response error:', response.error);
      console.log('✅ Response data:', response.data);

      if (response.error) {
        console.error('🚨 Edge function returned error:', response.error);
        throw new Error(response.error.message);
      }

      console.log('🎯 AI processing completed successfully');
      return response.data;
    } catch (error) {
      console.error('💥 AI processing failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
    try {
      console.log('🗄️ Starting bulk insert');
      console.log('📂 Category:', category);
      console.log('📊 Posts count:', posts.length);
      console.log('📋 Posts sample:', posts.slice(0, 2));
      
      // Convert ThemePost array to JSON and ensure status is properly typed
      const postsAsJson = posts.map((post, index) => {
        const processedPost = {
          ...post,
          status: post.status || 'draft' // Ensure status has a default
        };
        console.log(`📝 Post ${index + 1}:`, processedPost);
        return processedPost;
      });
      
      console.log('🔗 Calling Supabase RPC: insert_category_content');
      console.log('📤 RPC parameters:', {
        category_name: category,
        posts_data: postsAsJson
      });
      
      const { data, error } = await supabase
        .rpc('insert_category_content', {
          category_name: category,
          posts_data: postsAsJson
        });

      console.log('📥 RPC response - data:', data);
      console.log('📥 RPC response - error:', error);

      if (error) {
        console.error('🚨 Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Insert successful, count:', data);
      return data || 0;
    } catch (error) {
      console.error('💥 Insert failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to insert posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private sanitizeText(text: string): string {
    // Remove potential HTML/script tags and normalize whitespace
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

export const themeImportService = new ThemeImportService();