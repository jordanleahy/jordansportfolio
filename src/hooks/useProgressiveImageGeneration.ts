import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ColorTheme } from '@/types/colorTheme';

interface ProgressiveGenerationRequest {
  post: { 
    id: string; 
    title: string; 
    description: string; 
    category?: string; 
  };
  colorTheme?: ColorTheme;
  onPreview?: (previewUrl: string) => void;
  onFinal?: (finalUrl: string) => void;
  priority?: 'low' | 'normal' | 'high';
}

interface ProgressiveState {
  isGenerating: boolean;
  hasPreview: boolean;
  previewUrl: string | null;
  finalUrl: string | null;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}

interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
}

export const useProgressiveImageGeneration = () => {
  const { toast } = useToast();
  const [state, setState] = useState<ProgressiveState>({
    isGenerating: false,
    hasPreview: false,
    previewUrl: null,
    finalUrl: null,
    progress: 0,
    currentStep: '',
    estimatedTimeRemaining: 0
  });

  // Mobile optimization refs
  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const networkCondition = useRef<NetworkCondition>({ effectiveType: '4g', downlink: 10, rtt: 100 });

  // Detect network conditions
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        networkCondition.current = {
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100
        };
      }
    }
  }, []);

  const getOptimalQuality = () => {
    const { effectiveType, downlink } = networkCondition.current;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
      return { preview: 'low', final: 'medium' };
    } else if (effectiveType === '3g' || downlink < 5) {
      return { preview: 'medium', final: 'high' };
    }
    return { preview: 'medium', final: 'high' };
  };

  const generateWithExponentialBackoff = async (
    func: () => Promise<any>,
    attempt: number = 0
  ): Promise<any> => {
    try {
      return await func();
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateWithExponentialBackoff(func, attempt + 1);
      }
      throw error;
    }
  };

  const generateProgressiveImage = useCallback(async (
    request: ProgressiveGenerationRequest
  ): Promise<{ previewUrl: string | null; finalUrl: string | null }> => {
    // Cancel any existing generation
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    retryCount.current = 0;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      hasPreview: false,
      previewUrl: null,
      finalUrl: null,
      progress: 0,
      currentStep: 'Initializing progressive generation...',
      estimatedTimeRemaining: 15000
    }));

    try {
      const qualities = getOptimalQuality();
      const startTime = Date.now();

      // Step 1: Generate low-quality preview (5-8 seconds target)
      setState(prev => ({ 
        ...prev, 
        progress: 10, 
        currentStep: 'Generating preview...',
        estimatedTimeRemaining: 8000
      }));

      const previewGeneration = generateWithExponentialBackoff(async () => {
        const { data: previewData, error: previewError } = await supabase.functions.invoke(
          'generate-image-streamlined',
          {
            body: {
              postId: request.post.id,
              title: request.post.title,
              description: request.post.description,
              category: request.post.category || 'general',
              colorTheme: request.colorTheme || null,
              aspectRatio: '1:1',
              quality: qualities.preview,
              size: '512x512', // Smaller for preview
              requestKey: `preview_${request.post.id}_${Date.now()}`
            }
          }
        );

        if (previewError) throw new Error(`Preview generation failed: ${previewError.message}`);
        return previewData;
      });

      const previewResult = await previewGeneration;
      const previewTime = Date.now() - startTime;

      if (previewResult?.imageUrl) {
        setState(prev => ({ 
          ...prev, 
          hasPreview: true,
          previewUrl: previewResult.imageUrl,
          progress: 50,
          currentStep: 'Preview ready! Generating full quality...',
          estimatedTimeRemaining: Math.max(15000 - previewTime, 5000)
        }));

        request.onPreview?.(previewResult.imageUrl);

        toast({
          title: "Preview ready!",
          description: `Generated preview in ${(previewTime / 1000).toFixed(1)}s`,
        });
      }

      // Step 2: Generate full-quality image in background
      setState(prev => ({ 
        ...prev, 
        progress: 70, 
        currentStep: 'Generating full quality image...',
        estimatedTimeRemaining: Math.max(10000 - previewTime, 3000)
      }));

      const finalGeneration = generateWithExponentialBackoff(async () => {
        const { data: finalData, error: finalError } = await supabase.functions.invoke(
          'generate-image-streamlined',
          {
            body: {
              postId: request.post.id,
              title: request.post.title,
              description: request.post.description,
              category: request.post.category || 'general',
              colorTheme: request.colorTheme || null,
              aspectRatio: '1:1',
              quality: qualities.final,
              size: '1024x1024', // Full size
              requestKey: `final_${request.post.id}_${Date.now()}`
            }
          }
        );

        if (finalError) throw new Error(`Final generation failed: ${finalError.message}`);
        return finalData;
      });

      const finalResult = await finalGeneration;
      const totalTime = Date.now() - startTime;

      if (finalResult?.imageUrl) {
        setState(prev => ({ 
          ...prev, 
          finalUrl: finalResult.imageUrl,
          progress: 100,
          currentStep: 'Complete!',
          estimatedTimeRemaining: 0
        }));

        request.onFinal?.(finalResult.imageUrl);

        toast({
          title: "Full quality image ready!",
          description: `Total generation time: ${(totalTime / 1000).toFixed(1)}s`,
        });
      }

      return {
        previewUrl: previewResult?.imageUrl || null,
        finalUrl: finalResult?.imageUrl || null
      };

    } catch (error) {
      console.error('Progressive generation failed:', error);
      
      if ((error as Error).name === 'AbortError') {
        toast({
          title: "Generation cancelled",
          description: "Image generation was cancelled",
        });
      } else {
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Failed to generate image",
          variant: "destructive"
        });
      }

      return { previewUrl: null, finalUrl: null };
    } finally {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        estimatedTimeRemaining: 0
      }));
    }
  }, [toast]);

  const cancelGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        currentStep: 'Cancelled',
        estimatedTimeRemaining: 0
      }));
    }
  }, []);

  const getNetworkInfo = useCallback(() => {
    return networkCondition.current;
  }, []);

  return {
    ...state,
    generateProgressiveImage,
    cancelGeneration,
    getNetworkInfo,
    isSlowNetwork: networkCondition.current.effectiveType === 'slow-2g' || networkCondition.current.effectiveType === '2g'
  };
};