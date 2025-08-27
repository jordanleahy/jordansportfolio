import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ColorTheme } from '@/types/colorTheme';

interface UnifiedPromptRequest {
  title: string;
  description: string;
  category: string;
  theme?: string;
  themeId?: string;
  colorTheme?: ColorTheme;
  aspectRatio: string;
  priority?: 'low' | 'normal' | 'high';
}

interface PromptCacheEntry {
  prompt: string;
  timestamp: number;
  hits: number;
  colorScheme?: string;
  themeVariant?: string;
}

interface PromptGenerationMetrics {
  cacheHitRate: number;
  averageGenerationTime: number;
  totalRequests: number;
  backgroundPregenerated: number;
}

export const useUnifiedPromptManager = () => {
  // Multi-layer cache system
  const memoryCache = useRef(new Map<string, PromptCacheEntry>());
  const categoryCache = useRef(new Map<string, string[]>());
  const themeCache = useRef(new Map<string, any>());
  
  // Performance tracking
  const [metrics, setMetrics] = useState<PromptGenerationMetrics>({
    cacheHitRate: 0,
    averageGenerationTime: 0,
    totalRequests: 0,
    backgroundPregenerated: 0
  });

  // Background processing queue
  const backgroundQueue = useRef<UnifiedPromptRequest[]>([]);
  const isProcessingBackground = useRef(false);

  const generateCacheKey = (request: UnifiedPromptRequest): string => {
    const colorKey = request.colorTheme ? 
      `${request.colorTheme.primary_color}_${request.colorTheme.secondary_color}` : 
      'default';
    
    return `${request.category}_${request.theme || 'default'}_${request.aspectRatio}_${colorKey}`;
  };

  const generateSemanticKey = (request: UnifiedPromptRequest): string => {
    // Create semantic key for similar content matching
    const words = `${request.title} ${request.description}`.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .sort()
      .slice(0, 5)
      .join('_');
    
    return `semantic_${request.category}_${words}`;
  };

  const precomputeColorScheme = useCallback((colorTheme?: ColorTheme): string => {
    if (!colorTheme) return 'professional_blue_scheme';
    
    // Precompute optimal color combinations
    const primary = colorTheme.primary_color;
    const secondary = colorTheme.secondary_color;
    
    // Enhanced color analysis
    const isWarm = primary.includes('red') || primary.includes('orange') || primary.includes('yellow');
    const isCool = primary.includes('blue') || primary.includes('green') || primary.includes('purple');
    const isNeutral = primary.includes('gray') || primary.includes('black') || primary.includes('white');
    
    const scheme = {
      primary,
      secondary,
      accent: colorTheme.accent_color || (isWarm ? '#ff6b35' : isCool ? '#4ade80' : '#a855f7'),
      temperature: isWarm ? 'warm' : isCool ? 'cool' : 'neutral',
      contrast: 'high', // Could be computed based on color analysis
      harmony: 'complementary' // Could be computed based on color wheel
    };
    
    return JSON.stringify(scheme);
  }, []);

  const generatePromptWithCache = useCallback(async (
    request: UnifiedPromptRequest
  ): Promise<string> => {
    const startTime = Date.now();
    const cacheKey = generateCacheKey(request);
    const semanticKey = generateSemanticKey(request);
    
    // Check memory cache first
    const cached = memoryCache.current.get(cacheKey) || memoryCache.current.get(semanticKey);
    if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour TTL
      cached.hits++;
      return cached.prompt;
    }

    // Check database cache using existing cached_prompts table
    const { data: dbCached } = await supabase
      .from('cached_prompts')
      .select('prompt_text, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbCached?.prompt_text) {
      const entry: PromptCacheEntry = {
        prompt: dbCached.prompt_text,
        timestamp: Date.now(),
        hits: 1,
        colorScheme: precomputeColorScheme(request.colorTheme)
      };
      memoryCache.current.set(cacheKey, entry);
      
      // Update hit count in database
      supabase
        .from('cached_prompts')
        .update({ 
          hit_count: (dbCached as any).hit_count ? (dbCached as any).hit_count + 1 : 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('cache_key', cacheKey)
        .then(() => console.log('✅ Cache hit count updated'));
      
      return dbCached.prompt_text;
    }

    // Generate new prompt with enhanced system
    const prompt = await generateEnhancedPrompt(request);
    
    // Create cache entry
    const entry: PromptCacheEntry = {
      prompt,
      timestamp: Date.now(),
      hits: 1,
      colorScheme: precomputeColorScheme(request.colorTheme),
      themeVariant: request.theme
    };
    
    // Store in memory and database
    memoryCache.current.set(cacheKey, entry);
    
    // Store in database (non-blocking)
    supabase
      .from('cached_prompts')
      .upsert({
        cache_key: cacheKey,
        prompt_text: prompt,
        category: request.category,
        metadata: {
          theme: request.theme,
          color_scheme: entry.colorScheme,
          aspect_ratio: request.aspectRatio
        },
        user_id: null, // Allow system-wide caching
        expires_at: new Date(Date.now() + 86400000).toISOString() // 24 hours
      })
      .then(() => console.log('✅ Prompt cached in database'));

    // Update metrics
    const generationTime = Date.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + 1,
      averageGenerationTime: (prev.averageGenerationTime * (prev.totalRequests - 1) + generationTime) / prev.totalRequests,
      cacheHitRate: (prev.totalRequests - 1) / prev.totalRequests
    }));

    return prompt;
  }, [precomputeColorScheme]);

  const generateEnhancedPrompt = async (request: UnifiedPromptRequest): Promise<string> => {
    const colorScheme = precomputeColorScheme(request.colorTheme);
    
    // Create a temporary post for unified prompt generation
    const { data: tempPost } = await supabase
      .from('social_media_posts')
      .insert({
        title: request.title,
        description: request.description,
        category: request.category,
        theme_id: request.themeId,
        user_id: (await supabase.auth.getUser()).data.user?.id || null
      })
      .select('id')
      .single();
    
    if (!tempPost) {
      throw new Error('Failed to create temporary post for prompt generation');
    }

    const { data, error } = await supabase.functions.invoke('visual-prompt-generator', {
      body: {
        postId: tempPost.id,
        themeId: request.themeId,
        aspectRatio: request.aspectRatio
      }
    });

    // Clean up temporary post
    await supabase.from('social_media_posts').delete().eq('id', tempPost.id);

    if (error) {
      throw new Error(`Enhanced prompt generation failed: ${error.message}`);
    }

    return data.prompt;
  };

  const preloadPromptsForCategory = useCallback(async (
    category: string,
    commonThemes: string[] = []
  ): Promise<number> => {
    let preloadedCount = 0;
    
    const aspectRatios = ['1:1', '16:9', '9:16'];
    const priorities = ['normal', 'high'];
    
    for (const theme of commonThemes) {
      for (const aspectRatio of aspectRatios) {
        for (const priority of priorities) {
          const request: UnifiedPromptRequest = {
            title: `${category} content for ${theme}`,
            description: `Professional ${category} content focused on ${theme}`,
            category,
            theme,
            aspectRatio,
            priority: priority as 'normal' | 'high'
          };
          
          backgroundQueue.current.push(request);
          preloadedCount++;
        }
      }
    }
    
    // Start background processing
    processBackgroundQueue();
    
    return preloadedCount;
  }, []);

  const processBackgroundQueue = useCallback(async () => {
    if (isProcessingBackground.current || backgroundQueue.current.length === 0) {
      return;
    }
    
    isProcessingBackground.current = true;
    
    try {
      while (backgroundQueue.current.length > 0) {
        const request = backgroundQueue.current.shift();
        if (request) {
          await generatePromptWithCache(request);
          setMetrics(prev => ({
            ...prev,
            backgroundPregenerated: prev.backgroundPregenerated + 1
          }));
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Background prompt processing failed:', error);
    } finally {
      isProcessingBackground.current = false;
    }
  }, [generatePromptWithCache]);

  const getPromptVariations = useCallback(async (
    baseRequest: UnifiedPromptRequest,
    variationCount: number = 3
  ): Promise<string[]> => {
    const variations: string[] = [];
    
    // Generate variations with different styles
    const styleVariations = ['professional', 'creative', 'minimal', 'detailed'];
    
    for (let i = 0; i < Math.min(variationCount, styleVariations.length); i++) {
      const variationRequest = {
        ...baseRequest,
        theme: `${baseRequest.theme}_${styleVariations[i]}`
      };
      
      const prompt = await generatePromptWithCache(variationRequest);
      variations.push(prompt);
    }
    
    return variations;
  }, [generatePromptWithCache]);

  const clearCache = useCallback((type: 'memory' | 'database' | 'all' = 'all') => {
    if (type === 'memory' || type === 'all') {
      memoryCache.current.clear();
      categoryCache.current.clear();
      themeCache.current.clear();
    }
    
    if (type === 'database' || type === 'all') {
      supabase
        .from('cached_prompts')
        .delete()
        .lt('created_at', new Date(Date.now() - 86400000).toISOString()) // Clear old entries
        .then(() => console.log('✅ Database cache cleared'));
    }
  }, []);

  const getCacheStats = useCallback(() => {
    const memoryStats = {
      size: memoryCache.current.size,
      totalHits: Array.from(memoryCache.current.values()).reduce((sum, entry) => sum + entry.hits, 0)
    };
    
    return {
      memory: memoryStats,
      metrics,
      backgroundQueueLength: backgroundQueue.current.length,
      isProcessingBackground: isProcessingBackground.current
    };
  }, [metrics]);

  return {
    generatePrompt: generatePromptWithCache,
    preloadCategory: preloadPromptsForCategory,
    getVariations: getPromptVariations,
    clearCache,
    getCacheStats,
    metrics,
    processBackgroundQueue
  };
};