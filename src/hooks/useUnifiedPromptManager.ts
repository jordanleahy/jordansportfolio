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

    // Check database cache (simplified - using existing table)
    const { data: dbCached } = await supabase
      .from('social_media_posts')
      .select('generated_image_prompt, created_at')
      .eq('title', request.title)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbCached?.generated_image_prompt) {
      const entry: PromptCacheEntry = {
        prompt: dbCached.generated_image_prompt,
        timestamp: Date.now(),
        hits: 1,
        colorScheme: precomputeColorScheme(request.colorTheme)
      };
      memoryCache.current.set(cacheKey, entry);
      return dbCached.generated_image_prompt;
    }

    // Generate new prompt with enhanced system
    const prompt = await generateEnhancedPrompt(request);
    
    // Store in memory only for now
    memoryCache.current.set(cacheKey, entry);

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
    
    const { data, error } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
      body: {
        title: request.title,
        description: request.description,
        category: request.category,
        theme: request.theme,
        themeId: request.themeId,
        aspectRatio: request.aspectRatio,
        colorTheme: request.colorTheme,
        enhancedColorScheme: colorScheme,
        priority: request.priority || 'normal'
      }
    });

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
        .from('prompt_cache')
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