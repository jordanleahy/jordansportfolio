import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatio } from '@/types/bulkImageGeneration';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { createWatermarkedImageFile } from '@/utils/watermarkImage';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useParams } from 'react-router-dom';

interface UseImageManagerProps {
  onPostsChange: () => void;
  themeName?: string;
}

interface UseImageManagerReturn {
  handleGenerateImage: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3' | '1_1', title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export const useImageManager = ({ onPostsChange, themeName }: UseImageManagerProps): UseImageManagerReturn => {
  const { setProcessing } = useProcessingStatesContext();
  const queryClient = useQueryClient();

  // Debounced version of onPostsChange to prevent rapid refetches
  const debouncedOnPostsChange = useDebouncedCallback(onPostsChange, 200);
  
  const params = useParams();
  const routeTheme = params.theme ? decodeURIComponent(params.theme) : undefined;
  const theme = themeName ?? routeTheme;
  
  const sanitizeTitle = useCallback((title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }, []);






  const handleGenerateImage = async (
    postId: string, 
    aspectRatio: '16_9' | '9_16' | '3_4' | '4_3' | '1_1', 
    title: string, 
    description: string, 
    category?: string
  ) => {
    try {
      // Start shimmer immediately for this aspect ratio
      const visualAspect = aspectRatio.replace('_', ':') as AspectRatio;
      setProcessing(postId, 'generate', true, visualAspect);

      // Update status to uploading (DB)
      const statusField = `image_${aspectRatio}_status`;
      console.log(`🎨 IMAGE_GEN: Starting generation for post ${postId}, ratio ${aspectRatio}, setting status to 'uploading'`);
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'uploading' })
        .eq('id', postId);

      // Get existing prompt from cache first, fallback to database
      let generatedPrompt: string | null = null;
      
      // Try to get from React Query cache first
      const cachedData = queryClient.getQueryData(['individual_prompt', postId]);
      if (cachedData && typeof cachedData === 'object' && 'prompt' in cachedData) {
        generatedPrompt = cachedData.prompt as string;
        console.log('🎨 IMAGE_GEN: Using cached prompt');
      }
      
      // If not in cache, query database
      if (!generatedPrompt) {
        console.log('🎨 IMAGE_GEN: No cached prompt, querying database');
        const { data: postData } = await supabase
          .from('social_media_posts')
          .select('generated_image_prompt')
          .eq('id', postId)
          .maybeSingle();

        generatedPrompt = postData?.generated_image_prompt;
      }

      if (!generatedPrompt) {
        throw new Error('No image prompt found. Please try again or contact support.');
      }

      // Generate image directly with existing prompt
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
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${postId}_${aspectRatio}_${Date.now()}.jpg`;
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

      // Create and upload watermarked version (client-side)
      const wmStatusField = `image_${aspectRatio}_watermark_status`;
      const wmUrlField = `image_${aspectRatio}_watermark_url`;

      try {
        // Mark watermark processing
        await supabase.from('social_media_posts')
          .update({ [wmStatusField]: 'processing' })
          .eq('id', postId);

        const wmFile = await createWatermarkedImageFile(blob, fileName, 'image/jpeg');
        const uploadResult = await uploadFileToStorage(wmFile, 'social-media-images', 'watermarked');
        if (uploadResult.success && uploadResult.url) {
          await supabase.from('social_media_posts')
            .update({ [wmUrlField]: uploadResult.url, [wmStatusField]: 'complete' })
            .eq('id', postId);
        } else {
          await supabase.from('social_media_posts')
            .update({ [wmStatusField]: 'failed' })
            .eq('id', postId);
        }
      } catch (e) {
        await supabase.from('social_media_posts')
          .update({ [wmStatusField]: 'failed' })
          .eq('id', postId);
      }

      // Trigger background processing (kept for parity with backend workflows)
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
      // Clear shimmer state
      const visualAspect = aspectRatio.replace('_', ':') as AspectRatio;
      setProcessing(postId, 'generate', false, visualAspect);
      // No upload state to clear since we removed file upload functionality
    }
  };

  return {
    handleGenerateImage,
  };
};