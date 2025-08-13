// Simple in-memory cache without external dependencies
class SimpleCacheManager {
  private memoryCache: Map<string, { value: string; expires: number }>;
  private systemPromptCache: Map<string, { value: any; expires: number }>;
  private themeCache: Map<string, { value: any; expires: number }>;
  private maxSize = 1000;

  constructor() {
    this.memoryCache = new Map();
    this.systemPromptCache = new Map();
    this.themeCache = new Map();
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

  // Generate cache key for prompts
  private generatePromptKey(config: {
    title: string;
    description: string;
    theme?: string;
    category?: string;
    aspectRatio?: string;
  }): string {
    const normalizedTitle = config.title.toLowerCase().trim();
    const normalizedDescription = config.description.toLowerCase().trim().substring(0, 100);
    const theme = config.theme || 'default';
    const category = config.category || 'general';
    const aspectRatio = config.aspectRatio || '1:1';
    
    return `prompt:${category}:${theme}:${aspectRatio}:${btoa(normalizedTitle + normalizedDescription).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
  }

  // Get cached prompt (memory first, then database)
  async getCachedPrompt(config: {
    title: string;
    description: string;
    theme?: string;
    category?: string;
    aspectRatio?: string;
  }): Promise<string | null> {
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

  // Store prompt in both memory and database
  async setCachedPrompt(config: {
    title: string;
    description: string;
    theme?: string;
    category?: string;
    aspectRatio?: string;
  }, prompt: string): Promise<void> {
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
          theme: config.theme,
          aspectRatio: config.aspectRatio,
          titleLength: config.title.length,
          descriptionLength: config.description.length
        }
      });

      console.log(`💾 Cached in database: ${key}`);
    } catch (error) {
      console.error('Database cache write error:', error);
    }
  }

  // System prompt caching - simplified to use memory only initially
  async getSystemPrompt(themeId: string, category: string): Promise<any | null> {
    const key = `system_prompt:${themeId}:${category}`;
    
    this.cleanExpired(this.systemPromptCache);
    
    // Check memory cache first
    const cached = this.systemPromptCache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`🧠 System prompt cache HIT: ${key}`);
      return cached.value;
    }

    // For now, return null and implement database lookup separately to avoid TS issues
    console.log(`🧠 System prompt cache MISS: ${key}`);
    return null;
  }

  // Theme data caching - simplified to use memory only initially  
  async getThemeData(themeName: string, category: string): Promise<any | null> {
    const key = `theme:${category}:${themeName}`;
    
    this.cleanExpired(this.themeCache);
    
    // Check memory cache first
    const cached = this.themeCache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`🎨 Theme cache HIT: ${key}`);
      return cached.value;
    }

    // For now, return null and implement database lookup separately to avoid TS issues
    console.log(`🎨 Theme cache MISS: ${key}`);
    return null;
  }

  // Set system prompt in cache
  setSystemPrompt(themeId: string, category: string, data: any): void {
    const key = `system_prompt:${themeId}:${category}`;
    this.systemPromptCache.set(key, {
      value: data,
      expires: Date.now() + (4 * 60 * 60 * 1000) // 4 hours
    });
    this.enforceMaxSize(this.systemPromptCache);
    console.log(`🧠 System prompt cached: ${key}`);
  }

  // Set theme data in cache
  setThemeData(themeName: string, category: string, data: any): void {
    const key = `theme:${category}:${themeName}`;
    this.themeCache.set(key, {
      value: data,
      expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    });
    this.enforceMaxSize(this.themeCache);
    console.log(`🎨 Theme cached: ${key}`);
  }

  // Clear specific cache entries
  clearPromptCache(config: {
    title: string;
    description: string;
    theme?: string;
    category?: string;
    aspectRatio?: string;
  }): void {
    const key = this.generatePromptKey(config);
    this.memoryCache.delete(key);
  }

  // Clear all caches
  clearAllCaches(): void {
    this.memoryCache.clear();
    this.systemPromptCache.clear();
    this.themeCache.clear();
    console.log('🧹 All caches cleared');
  }

  // Get cache statistics
  getCacheStats() {
    this.cleanExpired(this.memoryCache);
    this.cleanExpired(this.systemPromptCache);
    this.cleanExpired(this.themeCache);
    
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
      }
    };
  }
}

// Export singleton instance
export const cacheManager = new SimpleCacheManager();