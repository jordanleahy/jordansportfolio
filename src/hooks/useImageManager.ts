import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';

interface UseImageManagerProps {
  onPostsChange: () => void;
}

interface UseImageManagerReturn {
  handleGenerateImage: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export const useImageManager = ({ onPostsChange }: UseImageManagerProps): UseImageManagerReturn => {

  // Debounced version of onPostsChange to prevent rapid refetches
  const debouncedOnPostsChange = useDebouncedCallback(onPostsChange, 200);

  const sanitizeTitle = useCallback((title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }, []);






  const handleGenerateImage = async (
    postId: string, 
    aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', 
    title: string, 
    description: string, 
    category?: string
  ) => {
    try {

      // Update status to uploading
      const statusField = `image_${aspectRatio}_status`;
      console.log(`🎨 IMAGE_GEN: Starting generation for post ${postId}, ratio ${aspectRatio}, setting status to 'uploading'`);
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'uploading' })
        .eq('id', postId);

      
      
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
      
      console.log(`🎨 IMAGE_GEN: Setting image URL and status to 'processing' for post ${postId}`, {
        imageField,
        statusField,
        url: urlData.publicUrl.substring(0, 100) + '...'
      });
      
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
      debouncedOnPostsChange();
      
      return { success: true, imageUrl: urlData.publicUrl };

    } catch (error) {
      console.error('🎨 SINGLE_IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
      
      // Update status to failed
      const statusField = `image_${aspectRatio}_status`;
      console.log(`❌ IMAGE_GEN: Setting status to 'failed' for post ${postId}, ratio ${aspectRatio}`);
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'failed' })
        .eq('id', postId);
        
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      // No upload state to clear since we removed file upload functionality
    }
  };

  return {
    handleGenerateImage,
  };
};