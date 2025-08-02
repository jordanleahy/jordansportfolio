import { supabase } from '@/integrations/supabase/client';
import { createSafeCacheKey } from '@/utils/textSanitization';

interface CachedSystemPrompt {
  prompt: string;
  agentName: string;
  lastUpdated: string;
  version: number;
  expiresAt: number;
}

interface SystemPromptCacheEntry {
  data: CachedSystemPrompt;
  timestamp: number;
}

export class SystemPromptCache {
  private static instance: SystemPromptCache;
  private memoryCache = new Map<string, SystemPromptCacheEntry>();
  private readonly MEMORY_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_MEMORY_ENTRIES = 50;

  private constructor() {
    this.setupPeriodicCleanup();
    this.loadFromStorage();
  }

  static getInstance(): SystemPromptCache {
    if (!SystemPromptCache.instance) {
      SystemPromptCache.instance = new SystemPromptCache();
    }
    return SystemPromptCache.instance;
  }

  private getCacheKey(category: string, userId: string): string {
    return createSafeCacheKey(`system_prompt_${category}_${userId}`);
  }

  private setupPeriodicCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > this.MEMORY_TTL || 
          (entry.data.expiresAt && now > entry.data.expiresAt)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // If cache is too large, remove oldest entries
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      const toKeep = entries.slice(0, this.MAX_MEMORY_ENTRIES);
      this.memoryCache.clear();
      
      for (const [key, entry] of toKeep) {
        this.memoryCache.set(key, entry);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [SystemPromptCache] Cleaned ${cleanedCount} expired entries`);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('system_prompt_cache_')) {
          keys.push(key);
        }
      }

      let loadedCount = 0;
      const now = Date.now();

      for (const storageKey of keys) {
        try {
          const data = localStorage.getItem(storageKey);
          if (data) {
            const parsed: SystemPromptCacheEntry = JSON.parse(data);
            
            // Check if entry is still valid
            if (now - parsed.timestamp < this.STORAGE_TTL && 
                (!parsed.data.expiresAt || now < parsed.data.expiresAt)) {
              const cacheKey = storageKey.replace('system_prompt_cache_', '');
              this.memoryCache.set(cacheKey, parsed);
              loadedCount++;
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        } catch (error) {
          console.warn(`Failed to load cache entry ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
        }
      }

      if (loadedCount > 0) {
        console.log(`📥 [SystemPromptCache] Loaded ${loadedCount} entries from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(cacheKey: string, entry: SystemPromptCacheEntry): void {
    try {
      const storageKey = `system_prompt_cache_${cacheKey}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save to storage:', error);
      // If storage is full, try to clear some space
      this.clearOldStorageEntries();
    }
  }

  private clearOldStorageEntries(): void {
    const keys: { key: string; timestamp: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('system_prompt_cache_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            keys.push({ key, timestamp: parsed.timestamp });
          }
        } catch {
          keys.push({ key, timestamp: 0 });
        }
      }
    }

    // Remove oldest 25% of entries
    keys.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = keys.slice(0, Math.floor(keys.length * 0.25));
    
    for (const { key } of toRemove) {
      localStorage.removeItem(key);
    }
  }

  async get(category: string, userId: string): Promise<CachedSystemPrompt | null> {
    const cacheKey = this.getCacheKey(category, userId);
    const now = Date.now();

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      if (now - memoryEntry.timestamp < this.MEMORY_TTL && 
          (!memoryEntry.data.expiresAt || now < memoryEntry.data.expiresAt)) {
        console.log(`⚡ [SystemPromptCache] Memory hit for ${category}`);
        return memoryEntry.data;
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    return null;
  }

  async set(
    category: string, 
    userId: string, 
    data: Omit<CachedSystemPrompt, 'expiresAt'>
  ): Promise<void> {
    const cacheKey = this.getCacheKey(category, userId);
    const now = Date.now();
    
    const entry: SystemPromptCacheEntry = {
      data: {
        ...data,
        expiresAt: now + this.STORAGE_TTL
      },
      timestamp: now
    };

    this.memoryCache.set(cacheKey, entry);
    this.saveToStorage(cacheKey, entry);
    
    console.log(`💾 [SystemPromptCache] Cached prompt for ${category}`);
  }

  async invalidate(category: string, userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(category, userId);
    this.memoryCache.delete(cacheKey);
    
    const storageKey = `system_prompt_cache_${cacheKey}`;
    localStorage.removeItem(storageKey);
    
    console.log(`🗑️ [SystemPromptCache] Invalidated cache for ${category}`);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    // Clear localStorage entries
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('system_prompt_cache_')) {
        keys.push(key);
      }
    }
    
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    
    console.log('🗑️ [SystemPromptCache] Cleared all cache');
  }

  getStats(): { memoryEntries: number; memorySize: number } {
    let memorySize = 0;
    
    for (const [key, entry] of this.memoryCache) {
      memorySize += JSON.stringify({ key, entry }).length;
    }
    
    return {
      memoryEntries: this.memoryCache.size,
      memorySize: Math.round(memorySize / 1024) // KB
    };
  }
}

export const systemPromptCache = SystemPromptCache.getInstance();