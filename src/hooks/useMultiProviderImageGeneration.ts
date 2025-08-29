import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaPost } from '@/types/socialMedia';

export type ImageProvider = 'openai' | 'gemini';

interface GenerationOptions {
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  useManagedSeed?: boolean;
  managedSeedCategory?: string | null;
  seedContext?: string | null;
  category?: string | null;
  provider?: ImageProvider;
}

interface GenerationResult {
  success: boolean;
  image?: string;
  aspectRatio?: string;
  error?: string;
  message?: string;
  currentStatus?: string;
  provider?: ImageProvider;
  processingTimeMs?: number;
  usage?: {
    estimated_cost: number;
  };
}

export const useMultiProviderImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ImageProvider>('openai');
  const { toast } = useToast();

  const generateImage = useCallback(async (
    post: SocialMediaPost,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    const {
      aspectRatio = '1:1',
      seed = null,
      useDeterministicSeed = false,
      useManagedSeed = false,
      managedSeedCategory = null,
      seedContext = null,
      category = null,
      provider = currentProvider
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
      console.log('🎨 Starting multi-provider image generation', {
        postId: post.id,
        aspectRatio,
        provider,
        prompt: post.generated_image_prompt.substring(0, 100)
      });

      let functionName: string;
      let requestBody: any;

      if (provider === 'gemini') {
        functionName = 'generate-image-gemini';
        requestBody = {
          postId: post.id,
          prompt: post.generated_image_prompt,
          aspectRatio,
          category
        };
      } else {
        functionName = 'generate-image-with-concurrency-control';
        requestBody = {
          postId: post.id,
          prompt: post.generated_image_prompt,
          aspectRatio,
          seed,
          useDeterministicSeed,
          useManagedSeed,
          managedSeedCategory,
          seedContext,
          category
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody
      });

      if (error) {
        console.error('🎨 Supabase function error:', error);
        toast({
          title: "Generation failed",
          description: `Failed to invoke ${provider} image generation function`,
          variant: "destructive",
        });
        return { success: false, error: error.message, provider };
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
        return data ? { ...data, provider } : { success: false, error: "Unknown error", provider };
      }

      const providerName = provider === 'gemini' ? 'Gemini' : 'OpenAI';
      toast({
        title: "Image generated successfully",
        description: `Generated ${aspectRatio} image using ${providerName} for "${post.title}"`,
      });

      console.log('🎨 Image generation successful', {
        postId: post.id,
        aspectRatio: data.aspectRatio,
        provider,
        processingTime: data.processingTimeMs,
        cost: data.usage?.estimated_cost
      });

      return { ...data, provider };

    } catch (error) {
      console.error('🎨 Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage, provider };
    } finally {
      setIsGenerating(false);
    }
  }, [toast, currentProvider]);

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
    isGenerating,
    currentProvider,
    setCurrentProvider
  };
};