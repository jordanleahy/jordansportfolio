import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { createWatermarkedImageFile } from '@/utils/watermarkImage';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useParams } from 'react-router-dom';
import { ColorTheme } from '@/types/colorTheme';

interface GenerationMetrics {
  correlationId: string;
  promptGenerationTime: number;
  imageGenerationTime: number;
  uploadTime: number;
  watermarkTime: number;
  totalTime: number;
  bottlenecks: string[];
  mobileOptimizations: string[];
}

interface GenerationStep {
  step: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number;
  message?: string;
}

export const useAdvancedImageGeneration = () => {
  const { toast } = useToast();
  const { enforceUsage, getBlockingMessage, getCreditStatus } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  // ❌ BAD: Using theme name from route params - Phase 1 migration incomplete
  // const params = useParams();
  // const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);

  const updateStep = (stepName: string, status: GenerationStep['status'], message?: string, duration?: number) => {
    setGenerationSteps(prev => {
      const existing = prev.find(s => s.step === stepName);
      if (existing) {
        return prev.map(s => 
          s.step === stepName 
            ? { ...s, status, message, duration }
            : s
        );
      } else {
        return [...prev, { step: stepName, status, message, duration }];
      }
    });
  };

  const generateHeroImageAdvanced = async (
    post: { id: string; title: string; description: string; category?: string },
    colorTheme?: ColorTheme,
    onPostsChange?: () => void
  ) => {
    const startTime = Date.now();
    let correlationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize metrics tracking
    let promptTime = 0, imageTime = 0, uploadTime = 0, watermarkTime = 0;
    const bottlenecks: string[] = [];
    const mobileOptimizations: string[] = [];

    // Reset state
    setGenerationSteps([]);
    setMetrics(null);

    // Enforce usage before starting generation
    const enforcement = await enforceUsage('image_generation', 1);
    if (!enforcement.allowed) {
      toast({
        title: 'Limit reached',
        description: getBlockingMessage(creditStatus) || enforcement.message || 'Usage limit exceeded.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      updateStep('Credit Check', 'complete', 'Usage verified');

      // Step 1: Fetch theme data
      updateStep('Theme Resolution', 'active', 'Resolving theme data...');
      const themeStart = Date.now();
      
      const { data: postData, error: fetchError } = await supabase
        .from('social_media_posts')
        .select('theme_id')
        .eq('id', post.id)
        .single();

      if (fetchError) {
        console.warn('Could not fetch theme_id for post:', fetchError.message);
      }

      const themeId = postData?.theme_id;
      const themeResolutionTime = Date.now() - themeStart;
      
      updateStep('Theme Resolution', 'complete', `Resolved in ${themeResolutionTime}ms`, themeResolutionTime);

      // Step 2: Generate prompt
      updateStep('Prompt Generation', 'active', 'Generating AI prompt...');
      const promptStart = Date.now();
      
      console.log('🎨 Advanced Generation - Color Theme Debug:', {
        correlationId,
        colorTheme: colorTheme ? {
          name: colorTheme.name,
          primary_color: colorTheme.primary_color,
          visual_style: colorTheme.visual_style,
          hasAllColors: !!(colorTheme.primary_color && colorTheme.secondary_color)
        } : null,
        themeId,
         // ❌ BAD: Using theme name - removed in Phase 1 migration
         // urlTheme: theme  // REMOVED - use themeId instead
      });

      const { data: promptData, error: promptError } = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: post.id,
          themeId,
          aspectRatio: '1:1'
        }
      });

      promptTime = Date.now() - promptStart;
      
      if (promptError) {
        updateStep('Prompt Generation', 'error', `Failed: ${promptError.message}`);
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }

      // Check for slow prompt generation
      if (promptTime > 10000) {
        bottlenecks.push(`Slow prompt generation: ${promptTime}ms`);
      }

      const prompt = promptData?.generatedPrompt || 
                    promptData?.generatedText || 
                    promptData?.prompt || 
                    promptData?.generated_prompt || 
                    promptData?.result ||
                    (typeof promptData === 'string' ? promptData : null);
      
      if (!prompt) {
        updateStep('Prompt Generation', 'error', 'No prompt generated');
        throw new Error(`No prompt generated. Response: ${JSON.stringify(promptData)}`);
      }

      updateStep('Prompt Generation', 'complete', `Generated in ${promptTime}ms`, promptTime);

      // Step 3: Generate image with advanced logging
      updateStep('Image Generation', 'active', 'Creating image with AI...');
      const imageStart = Date.now();
      
      // Use the advanced logging function for better insights
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt-advanced-logging', {
        body: {
          prompt: prompt,
          aspectRatio: '1:1',
          quality: 'high', // Use high quality but track performance
          backgroundProcessing: true
        }
      });

      imageTime = Date.now() - imageStart;
      
      if (imageError) {
        updateStep('Image Generation', 'error', `Failed: ${imageError.message}`);
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }

      // Check for slow image generation
      if (imageTime > 30000) {
        bottlenecks.push(`Slow image generation: ${imageTime}ms`);
        mobileOptimizations.push('Consider using lower quality for mobile');
      }

      const base64Image = imageData?.image;
      if (!base64Image) {
        updateStep('Image Generation', 'error', 'No image data received');
        throw new Error(`No image generated. Response: ${JSON.stringify(imageData)}`);
      }

      // Log advanced metrics if available
      if (imageData?.metadata) {
        console.log('🔍 Advanced Image Generation Metrics:', {
          correlationId: imageData.metadata.correlationId,
          totalDuration: imageData.metadata.totalDuration_ms,
          imageSize: imageData.metadata.size,
          estimatedSizeMB: imageData.metadata.estimatedSizeMB
        });
      }

      updateStep('Image Generation', 'complete', `Generated in ${imageTime}ms`, imageTime);

      // Step 4: Upload image
      updateStep('Image Upload', 'active', 'Uploading to storage...');
      const uploadStart = Date.now();
      
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      const fileName = `generated_${post.id}_1_1_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-media-images')
        .upload(fileName, file);

      if (uploadError) {
        updateStep('Image Upload', 'error', `Upload failed: ${uploadError.message}`);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(uploadData.path);

      uploadTime = Date.now() - uploadStart;
      
      // Check for slow upload
      if (uploadTime > 10000) {
        bottlenecks.push(`Slow upload: ${uploadTime}ms`);
        mobileOptimizations.push('Image compression could improve upload speed');
      }

      updateStep('Image Upload', 'complete', `Uploaded in ${uploadTime}ms`, uploadTime);

      // Step 5: Update database
      updateStep('Database Update', 'active', 'Updating post record...');
      
      await supabase
        .from('social_media_posts')
        .update({ 
          image_1_1_url: urlData.publicUrl,
          image_1_1_status: 'complete'
        })
        .eq('id', post.id);

      updateStep('Database Update', 'complete', 'Post updated successfully');

      // Step 6: Background watermarking
      updateStep('Watermark Processing', 'active', 'Creating watermarked version...');
      const watermarkStart = Date.now();
      
      // Handle watermarking in background
      handleWatermarkingBackground(blob, fileName, post.id)
        .then(() => {
          watermarkTime = Date.now() - watermarkStart;
          updateStep('Watermark Processing', 'complete', `Watermark added in ${watermarkTime}ms`, watermarkTime);
        })
        .catch((error) => {
          updateStep('Watermark Processing', 'error', `Watermark failed: ${error.message}`);
        });

      // Refresh posts data
      onPostsChange?.();
      
      const totalTime = Date.now() - startTime;

      // Analyze performance and provide recommendations
      if (totalTime > 45000) { // 45+ seconds total
        bottlenecks.push(`Total generation time: ${totalTime}ms`);
        mobileOptimizations.push('Consider implementing progressive loading');
      }

      // Create final metrics
      const finalMetrics: GenerationMetrics = {
        correlationId,
        promptGenerationTime: promptTime,
        imageGenerationTime: imageTime,
        uploadTime: uploadTime,
        watermarkTime: 0, // Will be updated by background process
        totalTime,
        bottlenecks,
        mobileOptimizations
      };

      setMetrics(finalMetrics);

      // Log comprehensive performance data
      console.log('📊 Generation Performance Analysis:', {
        correlationId,
        breakdown: {
          prompt: `${promptTime}ms`,
          image: `${imageTime}ms`, 
          upload: `${uploadTime}ms`,
          total: `${totalTime}ms`
        },
        bottlenecks,
        mobileOptimizations,
        colorThemeUsed: !!colorTheme
      });

      toast({
        title: "Hero image generated!",
        description: `Generated in ${(totalTime / 1000).toFixed(1)}s${bottlenecks.length > 0 ? ' (performance warnings logged)' : ''}`,
      });

    } catch (error) {
      console.error('Error in advanced image generation:', error);
      
      updateStep('Generation Failed', 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate hero image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Background watermarking function
  const handleWatermarkingBackground = async (
    blob: Blob, 
    fileName: string, 
    postId: string
  ) => {
    try {
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
      throw error;
    }
  };

  return {
    isGenerating,
    generationSteps,
    generateHeroImage: generateHeroImageAdvanced,
    creditStatus,
    metrics
  };
};