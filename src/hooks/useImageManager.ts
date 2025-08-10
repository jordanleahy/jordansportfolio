import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatio } from '@/types/bulkImageGeneration';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';

interface UseImageManagerProps {
  onPostsChange: () => void;
}

interface UseImageManagerReturn {
  handleGenerateImage: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export const useImageManager = ({ onPostsChange }: UseImageManagerProps): UseImageManagerReturn => {
  const { setProcessing } = useProcessingStatesContext();

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
    // If user clicks 16:9 or 4:3, generate BOTH 16:9 and 4:3 safely in one go
    const targetRatios: Array<'16_9' | '4_3' | '9_16' | '3_4'> =
      aspectRatio === '16_9' || aspectRatio === '4_3' ? ['16_9', '4_3'] : [aspectRatio];

    // Start shimmer for all target ratios
    targetRatios.forEach(r => {
      const visualAspect = r.replace('_', ':') as AspectRatio;
      setProcessing(postId, 'generate', true, visualAspect);
    });

    try {
      // Fetch existing post info to reuse prompt and skip already-generated images
      const { data: post, error: fetchError } = await supabase
        .from('social_media_posts')
        .select('generated_image_prompt, image_16_9_url, image_4_3_url')
        .eq('id', postId)
        .maybeSingle();

      if (fetchError) {
        console.warn('⚠️ IMAGE_GEN: Could not fetch post (continuing):', fetchError.message);
      }

      // Determine which ratios actually need generation (skip if URL already exists)
      const needGeneration: Array<'16_9' | '4_3' | '9_16' | '3_4'> = targetRatios.filter(r => {
        if (!post) return true;
        if (r === '16_9') return !post.image_16_9_url;
        if (r === '4_3') return !post.image_4_3_url;
        return true;
      });

      if (needGeneration.length === 0) {
        toast.info('Images already exist for selected ratios.');
        return { success: true };
      }

      // Optimistically set status to 'uploading' for needed ratios
      const uploadingUpdate: Record<string, string> = {};
      needGeneration.forEach(r => {
        const statusField = `image_${r}_status`;
        uploadingUpdate[statusField] = 'uploading';
      });
      if (Object.keys(uploadingUpdate).length > 0) {
        await supabase
          .from('social_media_posts')
          .update(uploadingUpdate)
          .eq('id', postId);
      }

      // Step 1: Get or generate prompt once
      let generatedPrompt = post?.generated_image_prompt as string | undefined;
      if (!generatedPrompt) {
        toast.info('Generating image prompt...');
        const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
          body: {
            title,
            description,
            category: category || 'cdi',
            aspectRatio: needGeneration[0].replace('_', ':'),
          },
        });
        if (promptResponse.error) {
          throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
        }
        generatedPrompt = promptResponse.data?.generatedPrompt;
        if (!generatedPrompt) throw new Error('No prompt generated');
        // Cache/store prompt on post
        await supabase
          .from('social_media_posts')
          .update({ generated_image_prompt: generatedPrompt })
          .eq('id', postId);
      }

      // Step 2: Generate images for each needed ratio sequentially (safer for credits)
      toast.info(`Generating images with AI (${needGeneration.map(r => r.replace('_', ':')).join(', ')})...`);

      let firstUrl: string | undefined;
      let successCount = 0;
      const errors: Array<{ ratio: string; message: string }> = [];

      for (const r of needGeneration) {
        try {
          const ratioLabel = r.replace('_', ':');

          const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
            body: { prompt: generatedPrompt, aspectRatio: ratioLabel },
          });
          if (imageResponse.error) {
            throw new Error(`Failed to generate image (${ratioLabel}): ${imageResponse.error.message}`);
          }
          const base64Image = imageResponse.data?.image;
          if (!base64Image) throw new Error(`No image generated (${ratioLabel})`);

          // Convert to file and upload
          const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
          const blob = await response.blob();
          const fileName = `generated_${postId}_${r}_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('social-media-images')
            .upload(fileName, file);
          if (uploadError) throw new Error(`Failed to upload image (${ratioLabel}): ${uploadError.message}`);

          const { data: urlData } = supabase.storage
            .from('social-media-images')
            .getPublicUrl(uploadData.path);

          const imageField = `image_${r}_url`;
          const statusField = `image_${r}_status`;
          console.log(`🎨 IMAGE_GEN: ${ratioLabel} URL set, marking 'processing' for post ${postId}`);

          await supabase
            .from('social_media_posts')
            .update({ [imageField]: urlData.publicUrl, [statusField]: 'processing' })
            .eq('id', postId);

          // Trigger background processing for watermark, etc.
          await supabase.functions.invoke('process-uploaded-images', {
            body: { imageUrl: urlData.publicUrl, postId, aspectRatio: r },
          });

          successCount += 1;
          if (!firstUrl) firstUrl = urlData.publicUrl;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ ratio: r, message: msg });
          const statusField = `image_${r}_status`;
          await supabase
            .from('social_media_posts')
            .update({ [statusField]: 'failed' })
            .eq('id', postId);
          console.error(`❌ IMAGE_GEN: Error on ${r} for post ${postId}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === needGeneration.length
            ? 'Images generated successfully!'
            : `Some images generated (${successCount}/${needGeneration.length}); others failed.`
        );
        debouncedOnPostsChange();
        return { success: true, imageUrl: firstUrl };
      }

      // If we get here, all failed
      const firstErr = errors[0]?.message || 'Failed to generate images';
      toast.error(firstErr);
      return { success: false, error: firstErr };
    } catch (error) {
      console.error('🎨 MULTI_IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      // Clear shimmer state for all target ratios
      targetRatios.forEach(r => {
        const visualAspect = r.replace('_', ':') as AspectRatio;
        setProcessing(postId, 'generate', false, visualAspect);
      });
    }
  };

  return {
    handleGenerateImage,
  };
};