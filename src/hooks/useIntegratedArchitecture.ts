import { useState, useCallback } from 'react';
import { useUnifiedPromptManager } from './useUnifiedPromptManager';
import { useEnhancedColorThemeProcessing } from './useEnhancedColorThemeProcessing';
import { useComprehensiveMonitoring } from './useComprehensiveMonitoring';
import { useMobileOptimizedGeneration } from './useMobileOptimizedGeneration';
import { ColorTheme } from '@/types/colorTheme';
import { useToast } from '@/hooks/use-toast';

interface IntegratedSystemRequest {
  post: { 
    id: string; 
    title: string; 
    description: string; 
    category?: string; 
  };
  colorTheme?: ColorTheme;
  onSuccess?: (imageUrl: string) => void;
  onProgress?: (progress: number) => void;
  priority?: 'low' | 'normal' | 'high';
  useEnhancements?: boolean;
}

interface SystemPerformanceReport {
  overall: {
    status: 'optimal' | 'good' | 'degraded' | 'critical';
    score: number;
    recommendation: string;
  };
  components: {
    prompts: { status: string; cacheHitRate: number };
    colors: { status: string; processingSpeed: number };
    generation: { status: string; successRate: number };
    monitoring: { status: string; alertCount: number };
  };
  bottlenecks: any[];
  suggestions: string[];
}

export const useIntegratedArchitecture = () => {
  const { toast } = useToast();
  const promptManager = useUnifiedPromptManager();
  const colorProcessor = useEnhancedColorThemeProcessing();
  const monitoring = useComprehensiveMonitoring();
  const mobileGeneration = useMobileOptimizedGeneration();

  const [isInitialized, setIsInitialized] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'optimal' | 'good' | 'degraded' | 'critical'>('optimal');

  const initializeSystem = useCallback(async () => {
    if (isInitialized) return;

    try {
      // Start monitoring first
      monitoring.startMonitoring();
      
      // Preload common prompts in background
      const commonCategories = ['general', 'business', 'technology', 'healthcare'];
      for (const category of commonCategories) {
        promptManager.preloadCategory(category, ['professional', 'modern', 'creative']);
      }

      // Start background color theme processing
      promptManager.processBackgroundQueue();

      setIsInitialized(true);
      
      toast({
        title: "System optimized",
        description: "All performance enhancements are now active",
      });

    } catch (error) {
      console.error('System initialization failed:', error);
      toast({
        title: "Optimization warning",
        description: "Some performance features may be limited",
        variant: "destructive"
      });
    }
  }, [isInitialized, monitoring, promptManager, toast]);

  const generateWithFullOptimization = useCallback(async (
    request: IntegratedSystemRequest
  ): Promise<string | null> => {
    const startTime = Date.now();
    
    try {
      // Track the operation
      monitoring.trackOperation('full_generation_start', 0, true, {
        postId: request.post.id,
        hasColorTheme: !!request.colorTheme,
        priority: request.priority
      });

      // Step 1: Enhanced color theme processing (if needed)
      let enhancedColorScheme = null;
      if (request.colorTheme && request.useEnhancements !== false) {
        const colorStart = Date.now();
        
        enhancedColorScheme = await colorProcessor.computeScheme(request.colorTheme);
        
        monitoring.trackOperation('color_processing', Date.now() - colorStart, true, {
          themeId: request.colorTheme.id,
          computed: !!enhancedColorScheme
        });
      }

      // Step 2: Unified prompt generation with caching
      const promptStart = Date.now();
      
      const prompt = await promptManager.generatePrompt({
        title: request.post.title,
        description: request.post.description,
        category: request.post.category || 'general',
        themeId: request.colorTheme?.id,
        colorTheme: request.colorTheme,
        aspectRatio: '1:1',
        priority: request.priority || 'normal'
      });

      monitoring.trackOperation('prompt_generation', Date.now() - promptStart, true, {
        cacheHit: !!prompt,
        promptLength: prompt?.length
      });

      // Step 3: Mobile-optimized progressive generation
      const generationStart = Date.now();
      
      const imageUrl = await new Promise<string | null>((resolve) => {
        const cancel = mobileGeneration.generateImage({
          ...request,
          onSuccess: (url) => resolve(url),
          onProgress: request.onProgress
        });

        // Set timeout for failsafe
        setTimeout(() => {
          cancel();
          resolve(null);
        }, 120000); // 2 minute timeout
      });

      monitoring.trackOperation('mobile_generation', Date.now() - generationStart, !!imageUrl, {
        hasPreview: mobileGeneration.hasPreview,
        networkInfo: mobileGeneration.networkInfo
      });

      // Track overall operation
      monitoring.trackOperation('full_generation_complete', Date.now() - startTime, !!imageUrl, {
        totalSteps: 3,
        enhancedColorScheme: !!enhancedColorScheme,
        finalUrl: !!imageUrl
      });

      return imageUrl;

    } catch (error) {
      monitoring.trackOperation('full_generation_error', Date.now() - startTime, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }, [promptManager, colorProcessor, mobileGeneration, monitoring]);

  const getSystemPerformanceReport = useCallback((): SystemPerformanceReport => {
    const promptStats = promptManager.getCacheStats();
    const colorStats = colorProcessor.getCacheStats();
    const monitoringMetrics = monitoring.metrics;
    const bottlenecks = monitoring.bottlenecks;

    // Calculate overall system score
    const cacheScore = promptStats.metrics.cacheHitRate * 25;
    const speedScore = Math.max(0, 25 - (monitoringMetrics.averageGenerationTime / 1000));
    const reliabilityScore = (1 - monitoringMetrics.errorRate) * 25;
    const systemScore = Math.max(0, 25 - bottlenecks.length * 5);

    const overallScore = cacheScore + speedScore + reliabilityScore + systemScore;
    
    const overallStatus = overallScore >= 80 ? 'optimal' :
                         overallScore >= 60 ? 'good' :
                         overallScore >= 40 ? 'degraded' : 'critical';

    const suggestions = [];
    
    if (promptStats.metrics.cacheHitRate < 0.8) {
      suggestions.push('Optimize prompt caching strategy');
    }
    
    if (monitoringMetrics.averageGenerationTime > 15000) {
      suggestions.push('Consider progressive loading optimizations');
    }
    
    if (monitoringMetrics.errorRate > 0.05) {
      suggestions.push('Investigate and fix high error rate');
    }
    
    if (bottlenecks.length > 2) {
      suggestions.push('Address system bottlenecks for better performance');
    }

    return {
      overall: {
        status: overallStatus,
        score: Math.round(overallScore),
        recommendation: suggestions[0] || 'System is performing optimally'
      },
      components: {
        prompts: {
          status: promptStats.metrics.cacheHitRate > 0.8 ? 'optimal' : 'needs-improvement',
          cacheHitRate: promptStats.metrics.cacheHitRate
        },
        colors: {
          status: colorStats.isBackgroundProcessing ? 'processing' : 'ready',
          processingSpeed: colorStats.totalUsage / Math.max(1, colorStats.analysisCache)
        },
        generation: {
          status: monitoringMetrics.errorRate < 0.05 ? 'optimal' : 'degraded',
          successRate: 1 - monitoringMetrics.errorRate
        },
        monitoring: {
          status: monitoring.isMonitoring ? 'active' : 'inactive',
          alertCount: monitoring.alerts.filter(a => !a.resolved).length
        }
      },
      bottlenecks,
      suggestions
    };
  }, [promptManager, colorProcessor, monitoring]);

  const optimizeSystem = useCallback(async () => {
    try {
      // Clear old caches
      promptManager.clearCache('memory');
      colorProcessor.clearCache();

      // Preload high-priority content
      await promptManager.preloadCategory('business', ['professional', 'modern']);
      
      // Process background tasks
      promptManager.processBackgroundQueue();

      // Update system health
      const report = getSystemPerformanceReport();
      setSystemHealth(report.overall.status);

      toast({
        title: "System optimized",
        description: `Performance score: ${report.overall.score}/100`,
      });

      return report;

    } catch (error) {
      console.error('System optimization failed:', error);
      throw error;
    }
  }, [promptManager, colorProcessor, getSystemPerformanceReport, toast]);

  return {
    // Main generation function
    generateImage: generateWithFullOptimization,
    
    // System management
    initializeSystem,
    optimizeSystem,
    getPerformanceReport: getSystemPerformanceReport,
    
    // Component access
    promptManager,
    colorProcessor,
    monitoring,
    mobileGeneration,
    
    // Status
    isInitialized,
    systemHealth,
    
    // Current states
    isGenerating: mobileGeneration.isGenerating,
    generationProgress: mobileGeneration.progress,
    previewUrl: mobileGeneration.previewUrl,
    finalUrl: mobileGeneration.finalUrl
  };
};