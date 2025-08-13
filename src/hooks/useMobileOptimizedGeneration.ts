import { useState, useCallback, useRef, useEffect } from 'react';
import { useProgressiveImageGeneration } from './useProgressiveImageGeneration';
import { useToast } from '@/hooks/use-toast';
import { ColorTheme } from '@/types/colorTheme';

interface MobileGenerationRequest {
  post: { 
    id: string; 
    title: string; 
    description: string; 
    category?: string; 
  };
  colorTheme?: ColorTheme;
  onSuccess?: (imageUrl: string) => void;
  onProgress?: (progress: number) => void;
}

interface RequestQueue {
  request: MobileGenerationRequest;
  timestamp: number;
  priority: number;
}

export const useMobileOptimizedGeneration = () => {
  const { toast } = useToast();
  const progressiveGeneration = useProgressiveImageGeneration();
  
  // Request management
  const requestQueue = useRef<RequestQueue[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  // Mobile-specific state
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [currentFinal, setCurrentFinal] = useState<string | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  // Intelligent debouncing based on network conditions
  const getDebounceDelay = () => {
    const networkInfo = progressiveGeneration.getNetworkInfo();
    if (progressiveGeneration.isSlowNetwork) {
      return 2000; // 2s debounce on slow networks
    } else if (networkInfo.effectiveType === '3g') {
      return 1000; // 1s debounce on 3G
    }
    return 500; // 500ms debounce on good networks
  };

  // Smart request deduplication
  const generateRequestSignature = (request: MobileGenerationRequest) => {
    return `${request.post.id}-${request.post.title}-${request.colorTheme?.id || 'default'}`;
  };

  const addToQueue = useCallback((request: MobileGenerationRequest, priority: number = 1) => {
    const signature = generateRequestSignature(request);
    
    // Remove any existing requests with same signature
    requestQueue.current = requestQueue.current.filter(
      item => generateRequestSignature(item.request) !== signature
    );

    // Add new request
    requestQueue.current.push({
      request,
      timestamp: Date.now(),
      priority
    });

    // Sort by priority (higher first) then by timestamp
    requestQueue.current.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    setQueueLength(requestQueue.current.length);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || requestQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const queueItem = requestQueue.current.shift();
    setQueueLength(requestQueue.current.length);

    if (!queueItem) {
      isProcessing.current = false;
      return;
    }

    try {
      const { request } = queueItem;
      
      // Clear previous results
      setCurrentPreview(null);
      setCurrentFinal(null);

      const result = await progressiveGeneration.generateProgressiveImage({
        ...request,
        onPreview: (previewUrl) => {
          setCurrentPreview(previewUrl);
          request.onProgress?.(50);
        },
        onFinal: (finalUrl) => {
          setCurrentFinal(finalUrl);
          request.onSuccess?.(finalUrl);
          request.onProgress?.(100);
        }
      });

      // If no preview was generated but final exists, use final as preview
      if (!result.previewUrl && result.finalUrl) {
        setCurrentPreview(result.finalUrl);
        setCurrentFinal(result.finalUrl);
      }

    } catch (error) {
      console.error('Mobile generation failed:', error);
      
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      isProcessing.current = false;
      
      // Process next item in queue if any
      if (requestQueue.current.length > 0) {
        setTimeout(processQueue, 100);
      }
    }
  }, [progressiveGeneration, toast]);

  const generateWithMobileOptimizations = useCallback((
    request: MobileGenerationRequest,
    immediate: boolean = false
  ) => {
    const now = Date.now();
    lastRequestTime.current = now;

    // Add to queue with priority based on recency
    const priority = immediate ? 10 : 1;
    addToQueue(request, priority);

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set up debounced processing
    const debounceDelay = immediate ? 0 : getDebounceDelay();
    
    debounceTimer.current = setTimeout(() => {
      // Only process if this is the most recent request
      if (now === lastRequestTime.current) {
        processQueue();
      }
    }, debounceDelay);

    return () => {
      // Return cancellation function
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      progressiveGeneration.cancelGeneration();
    };
  }, [addToQueue, processQueue, progressiveGeneration]);

  const clearQueue = useCallback(() => {
    requestQueue.current = [];
    setQueueLength(0);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    progressiveGeneration.cancelGeneration();
  }, [progressiveGeneration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearQueue();
    };
  }, [clearQueue]);

  return {
    // Generation function
    generateImage: generateWithMobileOptimizations,
    
    // Current state
    isGenerating: progressiveGeneration.isGenerating,
    progress: progressiveGeneration.progress,
    currentStep: progressiveGeneration.currentStep,
    estimatedTimeRemaining: progressiveGeneration.estimatedTimeRemaining,
    
    // Progressive results
    previewUrl: currentPreview,
    finalUrl: currentFinal,
    hasPreview: progressiveGeneration.hasPreview,
    
    // Queue management
    queueLength,
    clearQueue,
    
    // Network info
    isSlowNetwork: progressiveGeneration.isSlowNetwork,
    networkInfo: progressiveGeneration.getNetworkInfo(),
    
    // Cancellation
    cancelGeneration: progressiveGeneration.cancelGeneration
  };
};