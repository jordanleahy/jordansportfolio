import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ColorTheme } from '@/types/colorTheme';
import { useToast } from '@/hooks/use-toast';

interface VisualPromptCacheEntry {
  themeId: string;
  basePrompt: string;
  colorInstructions: string;
  visualStyle: string;
  lastGenerated: string;
  hitCount: number;
}

interface VisualPromptCacheConfig {
  title: string;
  description: string;
  theme: ColorTheme;
  aspectRatio?: string;
}

class ThemeVisualPromptCache {
  private cache = new Map<string, VisualPromptCacheEntry>();
  private maxCacheSize = 100;
  private cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  private generateCacheKey(themeId: string): string {
    return `visual_prompt:${themeId}`;
  }

  private isExpired(entry: VisualPromptCacheEntry): boolean {
    return Date.now() - new Date(entry.lastGenerated).getTime() > this.cacheExpiryMs;
  }

  private cleanExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  private enforceMaxSize(): void {
    if (this.cache.size > this.maxCacheSize) {
      // Remove oldest entries (lowest hit count first)
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.hitCount - b.hitCount)
        .slice(0, this.cache.size - this.maxCacheSize);
      
      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  async getCachedVisualPrompt(config: VisualPromptCacheConfig): Promise<string | null> {
    this.cleanExpired();
    
    const key = this.generateCacheKey(config.theme.id);
    const cached = this.cache.get(key);
    
    if (cached && !this.isExpired(cached)) {
      // Update hit count
      cached.hitCount++;
      this.cache.set(key, cached);
      
      // Generate final prompt by combining base with specific content
      const finalPrompt = this.buildFinalPrompt(cached, config);
      console.log(`🎨 Visual prompt cache HIT: ${key}`);
      return finalPrompt;
    }
    
    console.log(`🎨 Visual prompt cache MISS: ${key}`);
    return null;
  }

  async setCachedVisualPrompt(
    config: VisualPromptCacheConfig, 
    basePrompt: string
  ): Promise<void> {
    const key = this.generateCacheKey(config.theme.id);
    
    const entry: VisualPromptCacheEntry = {
      themeId: config.theme.id,
      basePrompt,
      colorInstructions: config.theme.color_instructions,
      visualStyle: config.theme.visual_style,
      lastGenerated: new Date().toISOString(),
      hitCount: 1
    };
    
    this.cache.set(key, entry);
    this.enforceMaxSize();
    
    console.log(`🎨 Visual prompt cached: ${key}`);
  }

  private buildFinalPrompt(cached: VisualPromptCacheEntry, config: VisualPromptCacheConfig): string {
    const aspectRatio = config.aspectRatio || '1:1';
    const aspectInstruction = aspectRatio === '1:1' ? 'square format' : 
                             aspectRatio === '16:9' ? 'landscape format' : 
                             aspectRatio === '9:16' ? 'portrait format' : 'custom aspect ratio';
    
    return `${cached.basePrompt}

Title: ${config.title}
Description: ${config.description}

Color Theme (${config.theme.name}):
- Primary: ${config.theme.primary_color}
- Secondary: ${config.theme.secondary_color}  
- Accent: ${config.theme.accent_color}
- Background: ${config.theme.background_color}
- Text: ${config.theme.text_color}

Visual Style: ${cached.visualStyle}
Color Instructions: ${cached.colorInstructions}
Aspect Ratio: ${aspectRatio} (${aspectInstruction})

Ensure all colors match the specified theme exactly and maintain visual consistency.`;
  }

  getCacheStats() {
    this.cleanExpired();
    
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0);
    const avgHitRate = this.cache.size > 0 ? totalHits / this.cache.size : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: Math.min(avgHitRate / 10, 1), // Normalize to 0-1
      entriesByTheme: this.getEntriesByTheme()
    };
  }

  private getEntriesByTheme() {
    const themes = new Map<string, number>();
    for (const entry of this.cache.values()) {
      themes.set(entry.themeId, (themes.get(entry.themeId) || 0) + 1);
    }
    return Object.fromEntries(themes);
  }

  clearThemeCache(themeId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.themeId === themeId) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
const themeVisualPromptCache = new ThemeVisualPromptCache();

export const useThemeVisualPromptCache = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { toast } = useToast();

  const generateWithThemeCache = useCallback(async (config: VisualPromptCacheConfig): Promise<string | null> => {
    setIsGenerating(true);
    setFromCache(false);

    try {
      // First check theme-specific cache
      const cachedPrompt = await themeVisualPromptCache.getCachedVisualPrompt(config);
      
      if (cachedPrompt) {
        setFromCache(true);
        toast({
          title: "Theme Prompt Retrieved",
          description: `Using cached visual prompt for ${config.theme.name} theme.`,
        });
        return cachedPrompt;
      }

      // Generate new theme-specific base prompt
      console.log('🎨 Generating new theme-specific visual prompt...');
      // Generate a synthetic post for theme template generation
      const { data: templatePost } = await supabase
        .from('social_media_posts')
        .insert({
          title: 'Theme Visual Style Template',
          description: `Generate a reusable visual style template for the ${config.theme.name} color theme with ${config.theme.visual_style} styling.`,
          theme_id: config.theme.id,
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        })
        .select('id')
        .single();
      
      if (!templatePost) {
        throw new Error('Failed to create template post');
      }

      const response = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: templatePost.id,
          themeId: config.theme.id,
          aspectRatio: '1:1'
        }
      });

      // Clean up template post
      await supabase.from('social_media_posts').delete().eq('id', templatePost.id);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate theme prompt');
      }

      const basePrompt = response.data?.generatedPrompt || response.data?.generatedText || '';
      
      if (!basePrompt) {
        throw new Error('No base prompt received from the service');
      }

      // Cache the base prompt for this theme
      await themeVisualPromptCache.setCachedVisualPrompt(config, basePrompt);
      
      // Build final prompt with specific content
      const finalPrompt = await themeVisualPromptCache.getCachedVisualPrompt(config);
      
      toast({
        title: "Theme Prompt Generated",
        description: `New visual prompt template created for ${config.theme.name} theme.`,
      });

      return finalPrompt;

    } catch (error) {
      console.error('Error in theme visual prompt generation:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate theme prompt. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const clearThemeCache = useCallback((themeId: string) => {
    themeVisualPromptCache.clearThemeCache(themeId);
    toast({
      title: "Theme Cache Cleared",
      description: "Visual prompt cache cleared for this theme.",
    });
  }, [toast]);

  const getCacheStats = useCallback(() => {
    return themeVisualPromptCache.getCacheStats();
  }, []);

  return {
    generateWithThemeCache,
    clearThemeCache,
    getCacheStats,
    isGenerating,
    fromCache
  };
};