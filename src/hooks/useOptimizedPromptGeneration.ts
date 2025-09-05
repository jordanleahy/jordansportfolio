import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';

interface BatchPromptRequest {
  postId: string;
  themeId: string;
  aspectRatio?: string;
  priority?: 'low' | 'normal' | 'high';
}

interface PromptGenerationResult {
  postId: string;
  prompt: string;
  success: boolean;
  error?: string;
}

interface GenerationMetrics {
  totalRequests: number;
  cacheHits: number;
  batchSize: number;
  averageTime: number;
}

export const useOptimizedPromptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState<GenerationMetrics>({
    totalRequests: 0,
    cacheHits: 0,
    batchSize: 0,
    averageTime: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Request deduplication and batching
  const pendingRequests = useRef(new Map<string, Promise<string>>());
  const batchQueue = useRef<BatchPromptRequest[]>([]);
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Multi-layer cache
  const memoryCache = useRef(new Map<string, { prompt: string; timestamp: number }>());
  
  const generateCacheKey = (postId: string, themeId: string, aspectRatio: string = '1:1') => 
    `${postId}_${themeId}_${aspectRatio}`;

  // Check cache first (memory -> database)
  const getCachedPrompt = useCallback(async (
    postId: string, 
    themeId: string, 
    aspectRatio: string = '1:1'
  ): Promise<string | null> => {
    const cacheKey = generateCacheKey(postId, themeId, aspectRatio);
    
    // Check memory cache (5 min TTL)
    const memoryEntry = memoryCache.current.get(cacheKey);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < 300000) {
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return memoryEntry.prompt;
    }
    
    // Check database cache
    const { data } = await supabase
      .from('social_media_posts')
      .select('generated_image_prompt')
      .eq('id', postId)
      .single();
    
    if (data?.generated_image_prompt) {
      // Store in memory cache
      memoryCache.current.set(cacheKey, {
        prompt: data.generated_image_prompt,
        timestamp: Date.now()
      });
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return data.generated_image_prompt;
    }
    
    return null;
  }, []);

  // Batch processing with request deduplication
  const processBatch = useCallback(async (requests: BatchPromptRequest[]): Promise<PromptGenerationResult[]> => {
    const startTime = Date.now();
    
    // Group by theme for efficient processing
    const byTheme = requests.reduce((acc, req) => {
      if (!acc[req.themeId]) acc[req.themeId] = [];
      acc[req.themeId].push(req);
      return acc;
    }, {} as Record<string, BatchPromptRequest[]>);
    
    const results: PromptGenerationResult[] = [];
    
    // Process each theme group in parallel
    const themePromises = Object.entries(byTheme).map(async ([themeId, themeRequests]) => {
      try {
        // Use edge function that can handle multiple posts
        const { data, error } = await supabase.functions.invoke('bulk-generate-prompts', {
          body: {
            requests: themeRequests.map(req => ({
              postId: req.postId,
              aspectRatio: req.aspectRatio || '1:1'
            })),
            themeId,
            batchSize: themeRequests.length
          }
        });
        
        if (error) throw error;
        
        // Process results and update database
        const updatePromises = data.results.map(async (result: any) => {
          const { postId, prompt } = result;
          
          // Update database
          await supabase
            .from('social_media_posts')
            .update({
              generated_image_prompt: prompt,
              individual_prompt_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', postId);
          
          // Update memory cache
          const cacheKey = generateCacheKey(postId, themeId);
          memoryCache.current.set(cacheKey, {
            prompt,
            timestamp: Date.now()
          });
          
          return { postId, prompt, success: true };
        });
        
        const themeResults = await Promise.all(updatePromises);
        results.push(...themeResults);
        
      } catch (error) {
        // Handle failed theme group
        themeRequests.forEach(req => {
          results.push({
            postId: req.postId,
            prompt: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }
    });
    
    await Promise.allSettled(themePromises);
    
    // Update metrics
    const processingTime = Date.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + requests.length,
      batchSize: requests.length,
      averageTime: (prev.averageTime + processingTime) / 2
    }));
    
    return results;
  }, []);

  // Add request to batch queue
  const queueBatchRequest = useCallback((request: BatchPromptRequest): Promise<string> => {
    const cacheKey = generateCacheKey(request.postId, request.themeId, request.aspectRatio);
    
    // Check if already pending
    const existing = pendingRequests.current.get(cacheKey);
    if (existing) return existing;
    
    const promise = new Promise<string>((resolve, reject) => {
      // Add to batch queue
      batchQueue.current.push({
        ...request,
        resolve,
        reject
      } as any);
      
      // Clear existing timeout and set new one
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      
      // Process batch after 100ms or when batch size reaches 10
      const shouldProcessImmediately = 
        batchQueue.current.length >= 10 || 
        request.priority === 'high';
        
      batchTimeout.current = setTimeout(
        async () => {
          const currentBatch = [...batchQueue.current];
          batchQueue.current = [];
          
          if (currentBatch.length === 0) return;
          
          try {
            const results = await processBatch(currentBatch);
            
            // Resolve individual promises
            results.forEach(result => {
              const batchRequest = currentBatch.find(req => req.postId === result.postId);
              if (batchRequest) {
                if (result.success) {
                  (batchRequest as any).resolve(result.prompt);
                } else {
                  (batchRequest as any).reject(new Error(result.error));
                }
              }
            });
            
          } catch (error) {
            // Reject all promises in batch
            currentBatch.forEach(req => {
              (req as any).reject(error);
            });
          } finally {
            // Clear pending requests
            currentBatch.forEach(req => {
              const key = generateCacheKey(req.postId, req.themeId, req.aspectRatio);
              pendingRequests.current.delete(key);
            });
          }
        },
        shouldProcessImmediately ? 0 : 100
      );
    });
    
    pendingRequests.current.set(cacheKey, promise);
    return promise;
  }, [processBatch]);

  // Main generation function with smart caching
  const generatePrompt = useCallback(async (
    postId: string,
    themeId: string,
    aspectRatio: string = '1:1',
    options: { priority?: 'low' | 'normal' | 'high'; force?: boolean } = {}
  ): Promise<string> => {
    try {
      // Check cache first unless forced
      if (!options.force) {
        const cached = await getCachedPrompt(postId, themeId, aspectRatio);
        if (cached) return cached;
      }
      
      // Queue for batch processing
      return await queueBatchRequest({
        postId,
        themeId,
        aspectRatio,
        priority: options.priority || 'normal'
      });
      
    } catch (error) {
      console.error('Prompt generation failed:', error);
      throw error;
    }
  }, [getCachedPrompt, queueBatchRequest]);

  // Batch generate for multiple posts
  const generateBatch = useCallback(async (
    requests: Array<{ postId: string; themeId: string; aspectRatio?: string }>
  ): Promise<PromptGenerationResult[]> => {
    setIsGenerating(true);
    
    try {
      // Check cache for each request first
      const uncachedRequests: BatchPromptRequest[] = [];
      const cachedResults: PromptGenerationResult[] = [];
      
      for (const req of requests) {
        const cached = await getCachedPrompt(req.postId, req.themeId, req.aspectRatio);
        if (cached) {
          cachedResults.push({
            postId: req.postId,
            prompt: cached,
            success: true
          });
        } else {
          uncachedRequests.push({
            postId: req.postId,
            themeId: req.themeId,
            aspectRatio: req.aspectRatio || '1:1',
            priority: 'high' // Batch requests are high priority
          });
        }
      }
      
      // Process uncached requests
      const newResults = uncachedRequests.length > 0 
        ? await processBatch(uncachedRequests)
        : [];
      
      const allResults = [...cachedResults, ...newResults];
      
      // Invalidate affected queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.themes }),
        ...requests.map(req => 
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.individualPrompt(req.postId) })
        )
      ]);
      
      toast({
        title: "Batch Generation Complete",
        description: `Generated ${newResults.length} new prompts, used ${cachedResults.length} cached.`
      });
      
      return allResults;
      
    } catch (error) {
      toast({
        title: "Batch Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCachedPrompt, processBatch, queryClient, toast]);

  // Clear cache
  const clearCache = useCallback((type: 'memory' | 'all' = 'memory') => {
    if (type === 'memory' || type === 'all') {
      memoryCache.current.clear();
    }
    
    if (type === 'all') {
      // Clear pending requests
      pendingRequests.current.clear();
      batchQueue.current = [];
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
        batchTimeout.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, []);

  return {
    generatePrompt,
    generateBatch,
    isGenerating,
    metrics,
    clearCache,
    getCachedPrompt
  };
};