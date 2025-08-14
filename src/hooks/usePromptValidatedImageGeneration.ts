import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { createWatermarkedImageFile } from '@/utils/watermarkImage';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useParams } from 'react-router-dom';

interface GenerationSteps {
  promptValidation: 'pending' | 'active' | 'complete' | 'error';
  promptGeneration: 'pending' | 'active' | 'complete' | 'error';
  imageGeneration: 'pending' | 'active' | 'complete' | 'error';
  imageUpload: 'pending' | 'active' | 'complete' | 'error';
}

export const usePromptValidatedImageGeneration = () => {
  const { toast } = useToast();
  const { enforceUsage, getBlockingMessage, getCreditStatus } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  const params = useParams();
  const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [steps, setSteps] = useState<GenerationSteps>({
    promptValidation: 'pending',
    promptGeneration: 'pending',
    imageGeneration: 'pending',
    imageUpload: 'pending'
  });

  const updateStep = useCallback((stepName: keyof GenerationSteps, status: GenerationSteps[keyof GenerationSteps]) => {
    setSteps(prev => ({ ...prev, [stepName]: status }));
  }, []);

  const validateExistingPrompt = useCallback(async (postId: string): Promise<string | null> => {
    try {
      updateStep('promptValidation', 'active');
      setGenerationStep('Checking existing prompt...');

      const { data: post, error } = await supabase
        .from('social_media_posts')
        .select('generated_image_prompt')
        .eq('id', postId)
        .single();

      if (error) {
        console.warn('Could not fetch existing prompt:', error.message);
        updateStep('promptValidation', 'error');
        return null;
      }

      const existingPrompt = post?.generated_image_prompt;
      
      if (existingPrompt && existingPrompt.trim().length > 50) {
        updateStep('promptValidation', 'complete');
        return existingPrompt;
      }

      updateStep('promptValidation', 'complete');
      return null;
    } catch (error) {
      updateStep('promptValidation', 'error');
      console.error('Error validating existing prompt:', error);
      return null;
    }
  }, [updateStep]);

  const generateNewPrompt = useCallback(async (
    post: { id: string; title: string; description: string; category?: string }
  ): Promise<string | null> => {
    try {
      updateStep('promptGeneration', 'active');
      setGenerationStep('Creating prompt...');

      // Fetch theme_id from database to ensure we have proper theme resolution
      const { data: postData, error: fetchError } = await supabase
        .from('social_media_posts')
        .select('theme_id')
        .eq('id', post.id)
        .single();

      if (fetchError) {
        console.warn('Could not fetch theme_id for post:', fetchError.message);
      }

      const themeId = postData?.theme_id;
      
      const { data: promptData, error: promptError } = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: post.id,
          themeId,
          aspectRatio: '1:1'
        }
      });

      if (promptError) {
        updateStep('promptGeneration', 'error');
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }
      
      // Try different possible response structures
      const prompt = promptData?.generatedPrompt || 
                    promptData?.generatedText || 
                    promptData?.prompt || 
                    promptData?.generated_prompt || 
                    promptData?.result ||
                    (typeof promptData === 'string' ? promptData : null);
      
      if (!prompt || prompt.trim().length < 20) {
        updateStep('promptGeneration', 'error');
        throw new Error(`Invalid prompt generated. Response: ${JSON.stringify(promptData)}`);
      }

      // Store the generated prompt in the database
      await supabase
        .from('social_media_posts')
        .update({ generated_image_prompt: prompt })
        .eq('id', post.id);

      updateStep('promptGeneration', 'complete');
      return prompt;
    } catch (error) {
      updateStep('promptGeneration', 'error');
      console.error('Error generating new prompt:', error);
      return null;
    }
  }, [updateStep]);

  const generateImageWithPrompt = useCallback(async (
    prompt: string,
    post: { id: string; title: string; description: string; category?: string },
    onPostsChange?: () => void
  ): Promise<void> => {
    try {
      updateStep('imageGeneration', 'active');
      setGenerationStep('Generating image...');
      
      // Generate image using the validated prompt
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: prompt,
          aspectRatio: '1:1'
        }
      });

      if (imageError) {
        updateStep('imageGeneration', 'error');
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }

      const base64Image = imageData?.image;
      if (!base64Image) {
        updateStep('imageGeneration', 'error');
        throw new Error(`No image generated. Response: ${JSON.stringify(imageData)}`);
      }

      updateStep('imageGeneration', 'complete');
      updateStep('imageUpload', 'active');
      setGenerationStep('Uploading image...');
      
      // Convert base64 to blob and upload to storage
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_1_1_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-media-images')
        .upload(fileName, file);

      if (uploadError) {
        updateStep('imageUpload', 'error');
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(uploadData.path);

      // Update post with image URL
      await supabase
        .from('social_media_posts')
        .update({ 
          image_1_1_url: urlData.publicUrl,
          image_1_1_status: 'complete'
        })
        .eq('id', post.id);

      updateStep('imageUpload', 'complete');

      // Create and upload watermarked variant (background processing)
      supabase.from('social_media_posts')
        .update({ image_1_1_watermark_status: 'processing' })
        .eq('id', post.id)
        .then(() => {
          createWatermarkedImageFile(blob, fileName, 'image/jpeg')
            .then(wmFile => uploadFileToStorage(wmFile, 'social-media-images', 'watermarked'))
            .then(uploadResult => {
              if (uploadResult.success && uploadResult.url) {
                return supabase.from('social_media_posts')
                  .update({ image_1_1_watermark_url: uploadResult.url, image_1_1_watermark_status: 'complete' })
                  .eq('id', post.id);
              } else {
                return supabase.from('social_media_posts')
                  .update({ image_1_1_watermark_status: 'failed' })
                  .eq('id', post.id);
              }
            })
            .catch(() => {
              supabase.from('social_media_posts')
                .update({ image_1_1_watermark_status: 'failed' })
                .eq('id', post.id);
            });
        });

      // Refresh the posts data
      onPostsChange?.();
      
      toast({
        title: "Hero image generated!",
        description: "Your 1:1 square hero image has been created successfully.",
      });

    } catch (error) {
      updateStep('imageGeneration', 'error');
      updateStep('imageUpload', 'error');
      throw error;
    }
  }, [updateStep, toast]);

  const generateHeroImage = useCallback(async (
    post: { id: string; title: string; description: string; category?: string },
    colorTheme?: { name: string },
    onPostsChange?: () => void
  ) => {
    // Enforce usage before starting generation
    const enforcement = await enforceUsage('gpt_image_generation', 1);
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
      setSteps({
        promptValidation: 'pending',
        promptGeneration: 'pending',
        imageGeneration: 'pending',
        imageUpload: 'pending'
      });
      
      // Step 1: Validate existing prompt
      let validatedPrompt = await validateExistingPrompt(post.id);
      
      // Step 2: Generate new prompt if needed
      if (!validatedPrompt) {
        validatedPrompt = await generateNewPrompt(post);
      }
      
      // Step 3: Ensure we have a valid prompt before proceeding
      if (!validatedPrompt) {
        throw new Error('Failed to create or validate image prompt. Cannot proceed with image generation.');
      }
      
      // Step 4: Generate image with validated prompt
      await generateImageWithPrompt(validatedPrompt, post, onPostsChange);

    } catch (error) {
      console.error('Error in prompt-validated image generation:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate hero image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  }, [
    enforceUsage, 
    getBlockingMessage, 
    creditStatus, 
    validateExistingPrompt, 
    generateNewPrompt, 
    generateImageWithPrompt,
    toast
  ]);

  return {
    isGenerating,
    generationStep,
    steps,
    generateHeroImage,
    creditStatus
  };
};