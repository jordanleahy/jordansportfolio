import React, { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useParams } from 'react-router-dom';

interface QueuedRequest {
  id: string;
  post: { id: string; title: string; description: string; category?: string };
  colorTheme?: { name: string };
  onPostsChange?: () => void;
  priority: number;
  timestamp: number;
}

interface GenerationMetrics {
  promptTime: number;
  imageTime: number;
  uploadTime: number;
  watermarkTime: number;
  totalTime: number;
}

export const useOptimizedImageGeneration = () => {
  const { toast } = useToast();
  const { enforceUsage, getBlockingMessage, getCreditStatus } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  // ❌ BAD: Using theme name from route params - Phase 1 migration incomplete
  // const params = useParams();
  // const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [requestQueue, setRequestQueue] = useState<QueuedRequest[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
  
  // Debounce queue processing to prevent rapid-fire requests
  const debouncedQueueProcessor = useDebounce(isProcessingQueue, 300);

  const processQueue = useCallback(async () => {
    if (requestQueue.length === 0 || isProcessingQueue) return;
    
    setIsProcessingQueue(true);
    
    // Sort by priority (higher first) then by timestamp (older first)
    const sortedQueue = [...requestQueue].sort((a, b) => 
      b.priority - a.priority || a.timestamp - b.timestamp
    );
    
    const request = sortedQueue[0];
    setRequestQueue(prev => prev.filter(r => r.id !== request.id));
    
    try {
      await generateHeroImageInternal(
        request.post,
        request.colorTheme,
        request.onPostsChange
      );
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  }, [requestQueue, isProcessingQueue]);

  // Process queue when debounced value changes
  React.useEffect(() => {
    if (debouncedQueueProcessor && requestQueue.length > 0) {
      processQueue();
    }
  }, [debouncedQueueProcessor, requestQueue.length, processQueue]);

  const generateHeroImageInternal = async (
    post: { id: string; title: string; description: string; category?: string },
    colorTheme?: { name: string },
    onPostsChange?: () => void
  ) => {
    const startTime = Date.now();
    let promptTime = 0, imageTime = 0, uploadTime = 0, watermarkTime = 0;
    
    try {
      setIsGenerating(true);
      setGenerationStep('Generating prompt...');
      
      const promptStart = Date.now();
      
      // Fetch theme_id from database
      const { data: postData, error: fetchError } = await supabase
        .from('social_media_posts')
        .select('theme_id')
        .eq('id', post.id)
        .single();

      if (fetchError) {
        console.warn('Could not fetch theme_id for post:', fetchError.message);
      }

      const themeId = postData?.theme_id;
      
      // Generate prompt using optimized function with new payload format
      console.log('🎯 [PROMPT_GEN] Starting prompt generation', { 
        postId: post.id, 
        themeId, 
        postTitle: post.title 
      });
      
      const { data: promptData, error: promptError } = await supabase.functions.invoke('create-single-image-prompt', {
        body: {
          postId: post.id,
          themeId,
          aspectRatio: '1:1'
        }
      });

      console.log('🎯 [PROMPT_GEN] Prompt generation response', { 
        success: !promptError,
        error: promptError?.message,
        dataKeys: promptData ? Object.keys(promptData) : null,
        promptLength: promptData?.generatedPrompt?.length || 0
      });

      if (promptError) {
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }
      
      const prompt = promptData?.generatedPrompt || 
                    promptData?.generatedText || 
                    promptData?.prompt || 
                    promptData?.generated_prompt || 
                    promptData?.result ||
                    (typeof promptData === 'string' ? promptData : null);
      
      if (!prompt) {
        throw new Error(`No prompt generated. Response: ${JSON.stringify(promptData)}`);
      }

      promptTime = Date.now() - promptStart;
      setGenerationStep('Generating image...');
      
      const imageStart = Date.now();
      
      // Generate image with unified function
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: prompt,
          aspectRatio: '1:1',
          backgroundProcessing: true // Enable background processing
        }
      });

      if (imageError) {
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }

      const base64Image = imageData?.image;
      if (!base64Image) {
        throw new Error(`No image generated. Response: ${JSON.stringify(imageData)}`);
      }

      imageTime = Date.now() - imageStart;
      setGenerationStep('Uploading image...');
      
      const uploadStart = Date.now();
      
      // Convert base64 to blob and upload to storage
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      const fileName = `generated_${post.id}_1_1_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-media-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(uploadData.path);

      uploadTime = Date.now() - uploadStart;

      // Update post with image URL
      await supabase
        .from('social_media_posts')
        .update({ 
          image_1_1_url: urlData.publicUrl,
          image_1_1_status: 'complete'
        })
        .eq('id', post.id);

      // Handle watermarking in background (non-blocking)
      const watermarkStart = Date.now();
      handleWatermarkingBackground(blob, fileName, post.id);
      watermarkTime = Date.now() - watermarkStart; // Just scheduling time

      // Refresh the posts data
      onPostsChange?.();
      
      const totalTime = Date.now() - startTime;
      setMetrics({ promptTime, imageTime, uploadTime, watermarkTime, totalTime });
      
      toast({
        title: "Hero image generated!",
        description: `Generated in ${(totalTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Error generating hero image:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate hero image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Background watermarking (non-blocking)
  const handleWatermarkingBackground = async (
    blob: Blob, 
    fileName: string, 
    postId: string
  ) => {
    try {
      const { createWatermarkedImageFile } = await import('@/utils/watermarkImage');
      const { uploadFileToStorage } = await import('@/utils/fileUpload');
      
      await supabase.from('social_media_posts')
        .update({ image_1_1_watermark_status: 'processing' })
        .eq('id', postId);

      const wmFile = await createWatermarkedImageFile(blob, fileName, 'image/jpeg');
      const uploadResult = await uploadFileToStorage(wmFile, 'social-media-images', 'watermarked');
      
      if (uploadResult.success && uploadResult.url) {
        await supabase.from('social_media_posts')
          .update({ 
            image_1_1_watermark_url: uploadResult.url, 
            image_1_1_watermark_status: 'complete' 
          })
          .eq('id', postId);
      } else {
        await supabase.from('social_media_posts')
          .update({ image_1_1_watermark_status: 'failed' })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Background watermarking failed:', error);
      await supabase.from('social_media_posts')
        .update({ image_1_1_watermark_status: 'failed' })
        .eq('id', postId);
    }
  };

  const generateHeroImage = useCallback(async (
    post: { id: string; title: string; description: string; category?: string },
    colorTheme?: { name: string },
    onPostsChange?: () => void,
    priority: number = 1
  ) => {
    // Enforce usage before queueing
    const enforcement = await enforceUsage('image_generation', 1);
    if (!enforcement.allowed) {
      toast({
        title: 'Limit reached',
        description: getBlockingMessage(creditStatus) || enforcement.message || 'Usage limit exceeded.',
        variant: 'destructive'
      });
      return;
    }

    // Add to queue instead of processing immediately
    const queuedRequest: QueuedRequest = {
      id: `${post.id}_${Date.now()}`,
      post,
      colorTheme,
      onPostsChange,
      priority,
      timestamp: Date.now()
    };

    setRequestQueue(prev => [...prev, queuedRequest]);
    
    toast({
      title: "Image generation queued",
      description: `Added to queue (${requestQueue.length + 1} pending)`,
    });
  }, [enforceUsage, getBlockingMessage, creditStatus, requestQueue.length, toast]);

  return {
    isGenerating,
    generationStep,
    generateHeroImage,
    creditStatus,
    queueLength: requestQueue.length,
    metrics,
    clearQueue: () => setRequestQueue([])
  };
};