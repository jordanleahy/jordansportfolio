import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AspectRatioKey } from '@/types/batchImageGeneration';

interface SingleImageGenerationState {
  uploadingPosts: Record<string, Record<AspectRatioKey, boolean>>;
  generationSteps: Record<string, string>;
}

export const useSingleImageGeneration = () => {
  const [state, setState] = useState<SingleImageGenerationState>({
    uploadingPosts: {},
    generationSteps: {}
  });

  const setUploading = (postId: string, aspectRatio: AspectRatioKey, isUploading: boolean) => {
    setState(prev => ({
      ...prev,
      uploadingPosts: {
        ...prev.uploadingPosts,
        [postId]: {
          ...prev.uploadingPosts[postId],
          [aspectRatio]: isUploading
        }
      }
    }));
  };

  const setGenerationStep = (postId: string, step: string) => {
    setState(prev => ({
      ...prev,
      generationSteps: {
        ...prev.generationSteps,
        [postId]: step
      }
    }));
  };

  const isUploading = (postId: string, aspectRatio: AspectRatioKey): boolean => {
    return state.uploadingPosts[postId]?.[aspectRatio] || false;
  };

  const getGenerationStep = (postId: string): string => {
    return state.generationSteps[postId] || '';
  };

  const generateSingleImage = async (
    postId: string, 
    aspectRatio: AspectRatioKey, 
    title: string, 
    description: string, 
    category?: string
  ) => {
    try {
      setUploading(postId, aspectRatio, true);
      setGenerationStep(postId, 'Generating prompt...');
      
      console.log('🎨 SINGLE_IMAGE_GENERATION: Starting for post:', postId, 'aspect:', aspectRatio);
      
      // Step 1: Generate prompt
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          title,
          description,
          category: category || 'cdi',
          aspectRatio: aspectRatio.replace('_', ':')
        }
      });

      if (promptResponse.error) {
        throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
      }

      const generatedPrompt = promptResponse.data?.generatedPrompt;
      if (!generatedPrompt) {
        throw new Error('No prompt generated');
      }

      // Store the generated prompt
      await supabase
        .from('social_media_posts')
        .update({ generated_image_prompt: generatedPrompt })
        .eq('id', postId);

      // Step 2: Generate image
      setGenerationStep(postId, 'Creating image...');
      toast.info('Generating image with AI...');

      const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: generatedPrompt,
          aspectRatio: aspectRatio.replace('_', ':')
        }
      });

      if (imageResponse.error) {
        throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
      }

      const base64Image = imageResponse.data?.image;
      if (!base64Image) {
        throw new Error('No image generated');
      }

      // Step 3: Convert to file and upload
      setGenerationStep(postId, 'Processing...');
      toast.info('Processing and uploading image...');

      // Convert base64 to blob
      const response = await fetch(`data:image/png;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${postId}_${aspectRatio}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

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
      const imageField = `image_${aspectRatio}_url`;
      const statusField = `image_${aspectRatio}_status`;
      
      await supabase
        .from('social_media_posts')
        .update({ 
          [imageField]: urlData.publicUrl,
          [statusField]: 'processing' // Will be updated by background processing
        })
        .eq('id', postId);

      // Trigger background processing for watermark
      await supabase.functions.invoke('process-uploaded-images', {
        body: {
          imageUrl: urlData.publicUrl,
          postId,
          aspectRatio
        }
      });

      toast.success('Image generated successfully!');
      
      return { success: true, imageUrl: urlData.publicUrl };

    } catch (error) {
      console.error('🎨 SINGLE_IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
      
      // Update status to failed
      const statusField = `image_${aspectRatio}_status`;
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'failed' })
        .eq('id', postId);
        
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setUploading(postId, aspectRatio, false);
      setGenerationStep(postId, '');
    }
  };

  return {
    generateSingleImage,
    isUploading,
    getGenerationStep
  };
};