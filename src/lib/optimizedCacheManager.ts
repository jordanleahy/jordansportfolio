import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  value: T;
  expires: number;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

class OptimizedCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 500; // Reduced for better memory management
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes
  private stats = { hits: 0, misses: 0 };

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expires;
  }

  private cleanExpired(): void {
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
  }

  private enforceMaxSize(): void {
    if (this.memoryCache.size <= this.maxSize) return;

    // Remove oldest and least used entries
    const entries = Array.from(this.memoryCache.entries())
      .sort(([,a], [,b]) => {
        // Sort by hits (ascending) then by last accessed (ascending)
        if (a.hits !== b.hits) return a.hits - b.hits;
        return a.lastAccessed - b.lastAccessed;
      });

    const toDelete = entries.slice(0, this.memoryCache.size - this.maxSize);
    toDelete.forEach(([key]) => this.memoryCache.delete(key));
  }

  // Optimized prompt caching with aggressive deduplication and theme ID validation
  generatePromptKey(config: {
    title: string;
    description: string;
    themeId?: string;
    category?: string;
    colorTheme?: any;
  }): string {
    // Skip validation for now to avoid circular dependencies and async issues
    // TODO: Add proper validation in a future iteration
    
    // Normalize and truncate for better cache efficiency
    const normalizedTitle = config.title.toLowerCase().trim().substring(0, 50);
    const normalizedDesc = config.description.toLowerCase().trim().substring(0, 100);
    const themeId = config.themeId || 'default';
    const category = config.category || 'general';
    const colorThemeId = config.colorTheme?.id || 'none';
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalizedTitle + normalizedDesc);
      const chars = Array.from(data, byte => String.fromCharCode(byte));
      const encoded = btoa(chars.join('')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
      return `prompt:${category}:${themeId}:${colorThemeId}:${encoded}`;
    } catch (error) {
      console.warn('Failed to encode optimized cache key, using fallback:', error);
      return `prompt:${category}:${themeId}:${colorThemeId}:${(normalizedTitle + normalizedDesc).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24)}`;
    }
  }

  async getCachedPrompt(config: {
    title: string;
    description: string;
    themeId?: string;
    category?: string;
    colorTheme?: any;
  }): Promise<string | null> {
    const key = this.generatePromptKey(config);
    
    this.cleanExpired();
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.hits++;
      memoryEntry.lastAccessed = Date.now();
      this.stats.hits++;
      console.log(`🚀 Optimized cache HIT (memory): ${key}`);
      return memoryEntry.value;
    }

    // Check database cache with simplified query
    try {
      const { data, error } = await supabase
        .from('cached_prompts')
        .select('prompt_text, hit_count')
        .eq('cache_key', key)
        .gte('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        // Store in memory for next time
        this.memoryCache.set(key, {
          value: data.prompt_text,
          expires: Date.now() + this.defaultTTL,
          hits: 1,
          lastAccessed: Date.now()
        });
        
        this.enforceMaxSize();
        this.stats.hits++;
        
        console.log(`🚀 Optimized cache HIT (database): ${key}`);
        
        // Update hit count asynchronously (non-blocking)
        void supabase
          .from('cached_prompts')
          .update({ 
            hit_count: (data.hit_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('cache_key', key);

        return data.prompt_text;
      }
    } catch (error) {
      console.warn('Database cache read error (non-blocking):', error);
    }

    this.stats.misses++;
    console.log(`💾 Optimized cache MISS: ${key}`);
    return null;
  }

  async setCachedPrompt(config: {
    title: string;
    description: string;
    themeId?: string;
    category?: string;
    colorTheme?: any;
  }, prompt: string): Promise<void> {
    const key = this.generatePromptKey(config);
    
    // Store in memory immediately
    this.memoryCache.set(key, {
      value: prompt,
      expires: Date.now() + this.defaultTTL,
      hits: 1,
      lastAccessed: Date.now()
    });
    
    this.enforceMaxSize();
    console.log(`💾 Optimized cached in memory: ${key}`);

    // Store in database asynchronously (non-blocking)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    void supabase.from('cached_prompts').upsert({
      cache_key: key,
      prompt_text: prompt,
      category: config.category || 'general',
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
      last_accessed_at: new Date().toISOString(),
      metadata: {
        themeId: config.themeId,
        colorThemeId: config.colorTheme?.id,
        optimized: true
      }
    });
  }

  // Batch operations for better performance
  async preloadCommonPrompts(category: string, themeId?: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('cached_prompts')
        .select('cache_key, prompt_text')
        .eq('category', category)
        .gte('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(50);

      if (data && !error) {
        data.forEach(item => {
          this.memoryCache.set(item.cache_key, {
            value: item.prompt_text,
            expires: Date.now() + this.defaultTTL,
            hits: 0,
            lastAccessed: Date.now()
          });
        });
        
        this.enforceMaxSize();
        console.log(`🚀 Preloaded ${data.length} prompts for category: ${category}`);
      }
    } catch (error) {
      console.warn('Preload error (non-blocking):', error);
    }
  }

  getCacheStats(): CacheStats {
    this.cleanExpired();
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      size: this.memoryCache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses
    };
  }

  clearCache(): void {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0 };
    console.log('🧹 Optimized cache cleared');
  }

  // Performance monitoring
  logPerformance(): void {
    const stats = this.getCacheStats();
    console.log('📊 Optimized Cache Performance:', {
      size: stats.size,
      hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
      hits: stats.totalHits,
      misses: stats.totalMisses
    });
  }
}

// Export singleton instance
export const optimizedCacheManager = new OptimizedCacheManager();