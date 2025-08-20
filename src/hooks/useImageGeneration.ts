import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { createWatermarkedImageFile } from '@/utils/watermarkImage';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useParams } from 'react-router-dom';

export const useImageGeneration = () => {
  const { toast } = useToast();
  const { enforceUsage, getBlockingMessage, getCreditStatus } = useCreditCheck();
  const creditStatus = getCreditStatus();
  
  // ❌ BAD: Using theme name from route params - Phase 1 migration incomplete
  // const params = useParams();
  // const theme = params.theme ? decodeURIComponent(params.theme) : undefined;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const generateHeroImage = async (
    post: { id: string; title: string; description: string; category?: string },
    colorTheme?: { name: string },
    onPostsChange?: () => void
  ) => {
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
      setGenerationStep('Generating prompt...');
      
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
      console.log('Theme resolution debug:', {
         // ❌ BAD: Using theme name - removed in Phase 1 migration
         // urlTheme: theme,  // REMOVED - use themeId instead
        fetchedThemeId: themeId,
        postCategory: post.category,
        colorTheme: colorTheme?.name
      });
      
      const { data: promptData, error: promptError } = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: post.id,
          themeId,
          aspectRatio: '1:1'
        }
      });

      if (promptError) {
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }
      
      // Try different possible response structures
      const prompt = promptData?.generatedPrompt || 
                    promptData?.generatedText || 
                    promptData?.prompt || 
                    promptData?.generated_prompt || 
                    promptData?.result ||
                    (typeof promptData === 'string' ? promptData : null);
      
      if (!prompt) {
        throw new Error(`No prompt generated. Response: ${JSON.stringify(promptData)}`);
      }

      setGenerationStep('Generating image...');
      
      // Generate image using the prompt
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: prompt,
          aspectRatio: '1:1'
        }
      });

      if (imageError) {
        throw new Error(`Failed to generate image: ${imageError.message}`);
      }

      const base64Image = imageData?.image;
      if (!base64Image) {
        throw new Error(`No image generated. Response: ${JSON.stringify(imageData)}`);
      }

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

      // Create and upload watermarked variant (background processing)
      // Set status to processing immediately and handle watermarking asynchronously
      supabase.from('social_media_posts')
        .update({ image_1_1_watermark_status: 'processing' })
        .eq('id', post.id)
        .then(() => {
          // Handle watermarking in background (non-blocking)
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

  return {
    isGenerating,
    generationStep,
    generateHeroImage,
    creditStatus
  };
};