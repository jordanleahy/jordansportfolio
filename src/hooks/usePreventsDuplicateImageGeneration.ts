import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaPost } from '@/types/socialMedia';

interface GenerationOptions {
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  category?: string | null;
}

interface GenerationResult {
  success: boolean;
  image?: string;
  aspectRatio?: string;
  error?: string;
  message?: string;
  currentStatus?: string;
}

export const usePreventsDuplicateImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = useCallback(async (
    post: SocialMediaPost,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    const {
      aspectRatio = '1:1',
      seed = null,
      useDeterministicSeed = false,
      category = null
    } = options;

    if (!post.generated_image_prompt) {
      toast({
        title: "No prompt available",
        description: "Please generate a prompt first before creating images.",
        variant: "destructive",
      });
      return { success: false, error: "No prompt available" };
    }

    setIsGenerating(true);

    try {
      console.log('🎨 Starting duplicate-prevention image generation', {
        postId: post.id,
        aspectRatio,
        prompt: post.generated_image_prompt.substring(0, 100)
      });

      const { data, error } = await supabase.functions.invoke('prevents-duplicate-image-generations', {
        body: {
          postId: post.id,
          prompt: post.generated_image_prompt,
          aspectRatio,
          seed,
          useDeterministicSeed,
          category
        }
      });

      if (error) {
        console.error('🎨 Supabase function error:', error);
        toast({
          title: "Generation failed",
          description: "Failed to invoke image generation function",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        if (data?.currentStatus === 'generating') {
          toast({
            title: "Generation in progress",
            description: "This image is already being generated in another tab or window.",
            variant: "default",
          });
        } else {
          toast({
            title: "Generation failed",
            description: data?.message || data?.error || "Unknown error occurred",
            variant: "destructive",
          });
        }
        return data || { success: false, error: "Unknown error" };
      }

      toast({
        title: "Image generated successfully",
        description: `Generated ${aspectRatio} image for "${post.title}"`,
      });

      console.log('🎨 Image generation successful', {
        postId: post.id,
        aspectRatio: data.aspectRatio,
        processingTime: data.processingTimeMs
      });

      return data;

    } catch (error) {
      console.error('🎨 Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const checkImageStatus = useCallback(async (
    postId: string,
    aspectRatio: string
  ): Promise<string | null> => {
    try {
      const statusField = `image_${aspectRatio.replace(':', '_')}_status`;
      
      const { data, error } = await supabase
        .from('social_media_posts')
        .select(statusField)
        .eq('id', postId)
        .maybeSingle();

      if (error) {
        console.error('Error checking image status:', error);
        return null;
      }

      return (data as any)?.[statusField] || 'none';
    } catch (error) {
      console.error('Error checking image status:', error);
      return null;
    }
  }, []);

  const canGenerateImage = useCallback(async (
    postId: string,
    aspectRatio: string
  ): Promise<boolean> => {
    const status = await checkImageStatus(postId, aspectRatio);
    return status === null || status === 'none' || status === 'failed' || status === 'error';
  }, [checkImageStatus]);

  return {
    generateImage,
    checkImageStatus,
    canGenerateImage,
    isGenerating
  };
};