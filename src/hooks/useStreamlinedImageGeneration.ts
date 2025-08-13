import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useParams } from 'react-router-dom';
import { ColorTheme } from '@/types/colorTheme';

interface StreamlinedGenerationRequest {
  post: { 
    id: string; 
    title: string; 
    description: string; 
    category?: string; 
  };
  colorTheme?: ColorTheme;
  onSuccess?: (imageUrl: string) => void;
  priority?: number;
}

interface GenerationMetrics {
  totalTime: number;
  cacheHit: boolean;
  promptTime: number;
  imageTime: number;
  uploadTime: number;
}

export const useStreamlinedImageGeneration = () => {
  const { toast } = useToast();
  const { enforceUsage, getBlockingMessage, getCreditStatus } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  const params = useParams();
  const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
  
  // Request deduplication
  const activeRequests = useRef(new Set<string>());
  const requestCache = useRef(new Map<string, Promise<string>>());

  const generateRequestKey = (request: StreamlinedGenerationRequest) => {
    return `${request.post.id}_${request.post.title}_${request.post.description}_${request.colorTheme?.id || 'default'}`;
  };

  const generateHeroImage = useCallback(async (request: StreamlinedGenerationRequest): Promise<string | null> => {
    const requestKey = generateRequestKey(request);
    
    // Check if request is already in progress
    if (activeRequests.current.has(requestKey)) {
      const cachedPromise = requestCache.current.get(requestKey);
      if (cachedPromise) {
        toast({
          title: "Generation in progress",
          description: "Using existing generation request",
        });
        return await cachedPromise;
      }
    }

    // Enforce usage limits
    const enforcement = await enforceUsage('gpt_image_generation', 1);
    if (!enforcement.allowed) {
      toast({
        title: 'Limit reached',
        description: getBlockingMessage(creditStatus) || enforcement.message || 'Usage limit exceeded.',
        variant: 'destructive'
      });
      return null;
    }

    // Create and cache the generation promise
    const generationPromise = generateImageInternal(request, requestKey);
    activeRequests.current.add(requestKey);
    requestCache.current.set(requestKey, generationPromise);

    try {
      const result = await generationPromise;
      return result;
    } finally {
      // Cleanup
      activeRequests.current.delete(requestKey);
      requestCache.current.delete(requestKey);
    }
  }, [enforceUsage, getBlockingMessage, creditStatus, theme, toast]);

  const generateImageInternal = async (
    request: StreamlinedGenerationRequest,
    requestKey: string
  ): Promise<string> => {
    const startTime = Date.now();
    let promptTime = 0;
    let imageTime = 0;
    let uploadTime = 0;
    let cacheHit = false;

    try {
      setIsGenerating(true);
      setGenerationProgress(10);
      setCurrentStep('Initializing generation...');

      // Call the streamlined edge function that handles everything in one go
      setCurrentStep('Generating content with AI...');
      setGenerationProgress(20);

      const functionStart = Date.now();
      
      const { data, error } = await supabase.functions.invoke('generate-image-streamlined', {
        body: {
          postId: request.post.id,
          title: request.post.title,
          description: request.post.description,
          category: request.post.category || 'general',
          theme: theme,
          colorTheme: request.colorTheme || null,
          aspectRatio: '1:1',
          quality: 'high',
          requestKey
        }
      });

      if (error) {
        throw new Error(`Generation failed: ${error.message}`);
      }

      const functionTime = Date.now() - functionStart;
      
      // Extract timing data from response
      promptTime = data?.metrics?.promptTime || 0;
      imageTime = data?.metrics?.imageTime || 0;
      uploadTime = data?.metrics?.uploadTime || 0;
      cacheHit = data?.metrics?.cacheHit || false;

      setGenerationProgress(90);
      setCurrentStep('Finalizing...');

      const imageUrl = data?.imageUrl;
      if (!imageUrl) {
        throw new Error('No image URL returned from generation');
      }

      // Call success callback if provided
      request.onSuccess?.(imageUrl);

      const totalTime = Date.now() - startTime;
      
      setMetrics({
        totalTime,
        cacheHit,
        promptTime,
        imageTime,
        uploadTime
      });

      setGenerationProgress(100);
      
      toast({
        title: "Image generated successfully!",
        description: `Generated in ${(totalTime / 1000).toFixed(1)}s${cacheHit ? ' (cache hit)' : ''}`,
      });

      return imageUrl;

    } catch (error) {
      console.error('Streamlined generation error:', error);
      
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
    }
  };

  const clearCache = useCallback(() => {
    requestCache.current.clear();
    activeRequests.current.clear();
    toast({
      title: "Cache cleared",
      description: "Generation cache has been cleared.",
    });
  }, [toast]);

  return {
    generateHeroImage,
    isGenerating,
    generationProgress,
    currentStep,
    creditStatus,
    metrics,
    clearCache,
    activeRequestCount: activeRequests.current.size
  };
};