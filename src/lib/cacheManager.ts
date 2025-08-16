import { cacheValidator } from './cacheValidator';
import { ThemeId, isValidThemeId, ThemeValidationError } from '@/types/stories/validation';

// Simple in-memory cache without external dependencies with strict theme ID validation
class SimpleCacheManager {
  private memoryCache: Map<string, { value: string; expires: number }>;
  private systemPromptCache: Map<string, { value: any; expires: number }>;
  private themeCache: Map<string, { value: any; expires: number }>;
  private visualPromptCache: Map<string, { value: any; expires: number }>;
  private maxSize = 1000;
  private migrationCompleted = false;

  constructor() {
    this.memoryCache = new Map();
    this.systemPromptCache = new Map();
    this.themeCache = new Map();
    this.visualPromptCache = new Map();
  }

  private isExpired(item: { value: any; expires: number }): boolean {
    return Date.now() > item.expires;
  }

  private cleanExpired(cache: Map<string, { value: any; expires: number }>): void {
    for (const [key, item] of cache.entries()) {
      if (this.isExpired(item)) {
        cache.delete(key);
      }
    }
  }

  private enforceMaxSize(cache: Map<string, any>): void {
    if (cache.size > this.maxSize) {
      const keys = Array.from(cache.keys());
      const keysToDelete = keys.slice(0, keys.length - this.maxSize);
      keysToDelete.forEach(key => cache.delete(key));
    }
  }

  // Generate validated cache key for prompts with strict theme ID enforcement
  private generatePromptKey(config: {
    postId?: string;
    title?: string;
    description?: string;
    themeId?: string;
    category?: string;
  }): string {
    // Validate and normalize configuration
    const validatedConfig = cacheValidator.validateCacheConfig(config);
    
    // Generate consistent cache key
    return cacheValidator.generateValidatedCacheKey(validatedConfig, 'prompt');
  }

  // Ensure migration is completed before cache operations
  private async ensureMigrationCompleted(): Promise<void> {
    if (this.migrationCompleted) {
      return;
    }

    try {
      const migrationResult = await cacheValidator.migrateLegacyCacheData();
      
      if (migrationResult.errors.length > 0) {
        console.warn('Cache migration completed with errors:', migrationResult.errors);
      } else {
        console.log(`Cache migration completed: cleaned ${migrationResult.cleanedCount} legacy entries`);
      }
      
      this.migrationCompleted = true;
    } catch (error) {
      console.error('Cache migration failed:', error);
      // Don't block cache operations, just log the error
      this.migrationCompleted = true;
    }
  }

  // Get cached prompt (memory first, then database) with strict validation
  async getCachedPrompt(config: {
    postId?: string;
    title?: string;
    description?: string;
    themeId?: string;
    category?: string;
  }): Promise<string | null> {
    // Ensure migration is completed
    await this.ensureMigrationCompleted();
    
    // Validate theme ID if provided
    if (config.themeId) {
      cacheValidator.validateThemeInCacheOperation(config.themeId, 'getCachedPrompt');
    }
    
    const key = this.generatePromptKey(config);
    
    // Clean expired entries
    this.cleanExpired(this.memoryCache);
    
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      console.log(`📦 Cache HIT (memory): ${key}`);
      return memoryResult.value;
    }

    // Check database cache
    try {
      const supabaseModule = await import('@/integrations/supabase/client');
      const response = await supabaseModule.supabase
        .from('cached_prompts')
        .select('prompt_text, hit_count')
        .eq('cache_key', key)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (response.data && !response.error) {
        console.log(`📦 Cache HIT (database): ${key}`);
        // Store in memory for next time
        this.memoryCache.set(key, {
          value: response.data.prompt_text,
          expires: Date.now() + (60 * 60 * 1000) // 1 hour
        });
        
        // Update hit count
        await supabaseModule.supabase
          .from('cached_prompts')
          .update({ 
            hit_count: (response.data.hit_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('cache_key', key);

        return response.data.prompt_text;
      }
    } catch (error) {
      console.error('Database cache read error:', error);
    }

    console.log(`📦 Cache MISS: ${key}`);
    return null;
  }

  // Store prompt in both memory and database with strict validation
  async setCachedPrompt(config: {
    postId?: string;
    title?: string;
    description?: string;
    themeId?: string;
    category?: string;
  }, prompt: string): Promise<void> {
    // Validate theme ID if provided
    if (config.themeId) {
      cacheValidator.validateThemeInCacheOperation(config.themeId, 'setCachedPrompt');
    }
    
    const key = this.generatePromptKey(config);
    
    // Store in memory immediately
    this.memoryCache.set(key, {
      value: prompt,
      expires: Date.now() + (60 * 60 * 1000) // 1 hour
    });
    this.enforceMaxSize(this.memoryCache);
    console.log(`💾 Cached in memory: ${key}`);

    // Store in database with expiration
    try {
      const supabaseModule = await import('@/integrations/supabase/client');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await supabaseModule.supabase.from('cached_prompts').upsert({
        cache_key: key,
        prompt_text: prompt,
        category: config.category || 'general',
        expires_at: expiresAt.toISOString(),
        hit_count: 0,
        last_accessed_at: new Date().toISOString(),
        metadata: {
          themeId: config.themeId,
          postId: config.postId,
          titleLength: config.title?.length || 0,
          descriptionLength: config.description?.length || 0
        }
      });

      console.log(`💾 Cached in database: ${key}`);
    } catch (error) {
      console.error('Database cache write error:', error);
    }
  }

  // System prompt caching with database lookup by theme_id only with strict validation
  async getSystemPrompt(themeId: string): Promise<any | null> {
    // Validate theme ID format
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'getSystemPrompt');
    const key = `system_prompt:${validatedThemeId}`;
    
    this.cleanExpired(this.systemPromptCache);
    
    // Check memory cache first
    const cached = this.systemPromptCache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`🧠 System prompt cache HIT: ${key}`);
      return cached.value;
    }

    // Check database for system prompt by theme_id
    try {
      const supabaseModule = await import('@/integrations/supabase/client');
      const response = await supabaseModule.supabase
        .from('system_prompts')
        .select('*')
        .eq('theme_id', themeId)
        .maybeSingle();

      if (response.data && !response.error) {
        console.log(`🧠 System prompt database HIT: ${key}`);
        // Store in memory for next time
        this.systemPromptCache.set(key, {
          value: response.data,
          expires: Date.now() + (4 * 60 * 60 * 1000) // 4 hours
        });
        return response.data;
      }
    } catch (error) {
      console.error('System prompt database lookup error:', error);
    }

    console.log(`🧠 System prompt cache MISS: ${key}`);
    return null;
  }

  // Theme data caching with database lookup by theme ID with strict validation  
  async getThemeData(themeId: string): Promise<any | null> {
    // Validate theme ID format
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'getThemeData');
    const key = `theme:${validatedThemeId}`;
    
    this.cleanExpired(this.themeCache);
    
    // Check memory cache first
    const cached = this.themeCache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`🎨 Theme cache HIT: ${key}`);
      return cached.value;
    }

    // Check database for theme by theme_id
    try {
      const supabaseModule = await import('@/integrations/supabase/client');
      const response = await supabaseModule.supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .maybeSingle();

      if (response.data && !response.error) {
        console.log(`🎨 Theme database HIT: ${key}`);
        // Store in memory for next time
        this.themeCache.set(key, {
          value: response.data,
          expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
        });
        return response.data;
      }
    } catch (error) {
      console.error('Theme database lookup error:', error);
    }

    console.log(`🎨 Theme cache MISS: ${key}`);
    return null;
  }

  // Set system prompt in cache with validation
  setSystemPrompt(themeId: string, data: any): void {
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'setSystemPrompt');
    const key = `system_prompt:${validatedThemeId}`;
    this.systemPromptCache.set(key, {
      value: data,
      expires: Date.now() + (4 * 60 * 60 * 1000) // 4 hours
    });
    this.enforceMaxSize(this.systemPromptCache);
    console.log(`🧠 System prompt cached: ${key}`);
  }

  // Set theme data in cache with validation
  setThemeData(themeId: string, data: any): void {
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'setThemeData');
    const key = `theme:${validatedThemeId}`;
    this.themeCache.set(key, {
      value: data,
      expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    });
    this.enforceMaxSize(this.themeCache);
    console.log(`🎨 Theme cached: ${key}`);
  }

  // Visual prompt caching per theme with validation
  async getVisualPromptByTheme(themeId: string): Promise<any | null> {
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'getVisualPromptByTheme');
    const key = `visual_prompt:${validatedThemeId}`;
    
    this.cleanExpired(this.visualPromptCache);
    
    const cached = this.visualPromptCache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`🎨 Visual prompt cache HIT: ${key}`);
      return cached.value;
    }

    console.log(`🎨 Visual prompt cache MISS: ${key}`);
    return null;
  }

  setVisualPromptByTheme(themeId: string, data: any): void {
    const validatedThemeId = cacheValidator.validateThemeInCacheOperation(themeId, 'setVisualPromptByTheme');
    const key = `visual_prompt:${validatedThemeId}`;
    this.visualPromptCache.set(key, {
      value: data,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
    this.enforceMaxSize(this.visualPromptCache);
    console.log(`🎨 Visual prompt cached: ${key}`);
  }

  // Clear specific cache entries
  clearPromptCache(config: {
    postId?: string;
    title?: string;
    description?: string;
    themeId?: string;
    category?: string;
  }): void {
    const key = this.generatePromptKey(config);
    this.memoryCache.delete(key);
  }

  // Clear all caches
  clearAllCaches(): void {
    this.memoryCache.clear();
    this.systemPromptCache.clear();
    this.themeCache.clear();
    this.visualPromptCache.clear();
    console.log('🧹 All caches cleared');
  }

  // Get cache statistics
  getCacheStats() {
    this.cleanExpired(this.memoryCache);
    this.cleanExpired(this.systemPromptCache);
    this.cleanExpired(this.themeCache);
    this.cleanExpired(this.visualPromptCache);
    
    return {
      prompts: {
        size: this.memoryCache.size,
        maxSize: this.maxSize,
        hitRate: 0.95 // Approximate for demo
      },
      systemPrompts: {
        size: this.systemPromptCache.size,
        maxSize: this.maxSize
      },
      themes: {
        size: this.themeCache.size,
        maxSize: this.maxSize
      },
      visualPrompts: {
        size: this.visualPromptCache.size,
        maxSize: this.maxSize
      }
    };
  }
}

// Export singleton instance
export const cacheManager = new SimpleCacheManager();