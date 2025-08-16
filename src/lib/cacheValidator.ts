// Cache validation and migration utilities for theme ID enforcement

import { supabase } from '@/integrations/supabase/client';
import { 
  ThemeId, 
  ThemeName, 
  isValidThemeId, 
  assertThemeId, 
  ValidatedCacheConfig,
  LegacyCacheEntry,
  CacheMigrationResult,
  ThemeValidationError 
} from '@/types/stories/validation';

export class CacheValidator {
  private static instance: CacheValidator;
  
  static getInstance(): CacheValidator {
    if (!CacheValidator.instance) {
      CacheValidator.instance = new CacheValidator();
    }
    return CacheValidator.instance;
  }

  // Validate and normalize cache configuration
  validateCacheConfig(config: {
    themeId?: string;
    category?: string;
    postId?: string;
    title?: string;
    description?: string;
  }): ValidatedCacheConfig {
    if (!config.themeId) {
      throw new ThemeValidationError(
        'Theme ID is required for cache operations',
        'INVALID_THEME_ID',
        { config }
      );
    }

    const validatedThemeId = assertThemeId(config.themeId);
    
    return {
      themeId: validatedThemeId,
      category: config.category || 'general',
      postId: config.postId,
      title: config.title,
      description: config.description
    };
  }

  // Generate consistent cache key format
  generateValidatedCacheKey(config: ValidatedCacheConfig, type: 'prompt' | 'system_prompt' | 'theme' | 'visual_prompt'): string {
    const parts = [type, config.category, config.themeId];
    
    if (type === 'prompt' && config.postId) {
      parts.push(config.postId);
    } else if (type === 'prompt' && (config.title || config.description)) {
      // Generate hash for title/description based keys
      const content = `${config.title || ''}${config.description || ''}`;
      const hash = this.generateContentHash(content);
      parts.push(hash);
    }
    
    return parts.join(':');
  }

  private generateContentHash(content: string): string {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content.toLowerCase().trim().substring(0, 100));
      const chars = Array.from(data, byte => String.fromCharCode(byte));
      return btoa(chars.join('')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
    } catch (error) {
      console.warn('Failed to generate content hash, using fallback:', error);
      return content.replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
    }
  }

  // Detect legacy cache entries that use theme names
  detectLegacyCacheEntries(cacheKeys: string[]): LegacyCacheEntry[] {
    return cacheKeys.map(key => {
      const parts = key.split(':');
      
      // Check for theme name patterns (non-UUID theme identifiers)
      const isLegacy = parts.some(part => {
        // Skip known prefixes and categories
        if (['prompt', 'system_prompt', 'theme', 'visual_prompt', 'general', 'cdi', 'technology'].includes(part)) {
          return false;
        }
        
        // Check if this part could be a theme name (not a UUID)
        if (part.length > 5 && !isValidThemeId(part)) {
          // Additional heuristics for theme names
          return part.includes('_') || part.includes('-') || /[a-zA-Z]{3,}/.test(part);
        }
        
        return false;
      });

      return {
        key,
        isLegacy,
        shouldMigrate: isLegacy
      };
    });
  }

  // Migrate legacy cache entries
  async migrateLegacyCacheData(): Promise<CacheMigrationResult> {
    const result: CacheMigrationResult = {
      migratedCount: 0,
      cleanedCount: 0,
      errors: []
    };

    try {
      // Get all cached prompts from database
      const { data: cachedPrompts, error } = await supabase
        .from('cached_prompts')
        .select('id, cache_key, prompt_text, category, metadata')
        .limit(1000);

      if (error) {
        result.errors.push(`Failed to fetch cached prompts: ${error.message}`);
        return result;
      }

      if (!cachedPrompts || cachedPrompts.length === 0) {
        console.log('No cached prompts found to migrate');
        return result;
      }

      const cacheKeys = cachedPrompts.map(p => p.cache_key);
      const legacyEntries = this.detectLegacyCacheEntries(cacheKeys);
      const legacyKeys = legacyEntries.filter(e => e.isLegacy).map(e => e.key);

      if (legacyKeys.length === 0) {
        console.log('No legacy cache entries found');
        return result;
      }

      console.log(`Found ${legacyKeys.length} legacy cache entries to clean up`);

      // Delete legacy cache entries (safer than attempting migration without theme mapping)
      const { error: deleteError } = await supabase
        .from('cached_prompts')
        .delete()
        .in('cache_key', legacyKeys);

      if (deleteError) {
        result.errors.push(`Failed to clean legacy cache entries: ${deleteError.message}`);
      } else {
        result.cleanedCount = legacyKeys.length;
        console.log(`Cleaned ${legacyKeys.length} legacy cache entries`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Migration failed: ${errorMessage}`);
    }

    return result;
  }

  // Validate theme ID in cache operations
  validateThemeInCacheOperation(themeId: string, operation: string): ThemeId {
    try {
      const validatedId = assertThemeId(themeId);
      console.log(`✅ Valid theme ID for ${operation}: ${validatedId}`);
      return validatedId;
    } catch (error) {
      throw new ThemeValidationError(
        `Invalid theme ID in ${operation}: ${themeId}`,
        'INVALID_THEME_ID',
        { themeId, operation }
      );
    }
  }

  // Prevent legacy theme name usage
  preventLegacyThemeNameUsage(value: string, context: string): void {
    if (!isValidThemeId(value)) {
      // Check if it looks like a theme name
      if (value.includes('_') || value.includes(' ') || /^[a-zA-Z]/.test(value)) {
        throw new ThemeValidationError(
          `Legacy theme name usage detected in ${context}: ${value}. Use theme ID instead.`,
          'LEGACY_THEME_NAME_USAGE',
          { value, context }
        );
      }
    }
  }
}

// Singleton instance
export const cacheValidator = CacheValidator.getInstance();