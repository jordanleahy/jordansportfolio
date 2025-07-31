import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ImageGenerationState {
  isGenerating: boolean;
  progress: string;
  error: string | null;
}

export function useSimpleImageGeneration() {
  const [state, setState] = useState<ImageGenerationState>({
    isGenerating: false,
    progress: '',
    error: null
  });
  
  const queryClient = useQueryClient();

  const generateImage = useCallback(async (postId: string, aspectRatio: string = '16:9') => {
    setState({ isGenerating: true, progress: 'Starting generation...', error: null });

    try {
      // Step 1: Generate prompt
      setState(prev => ({ ...prev, progress: 'Generating image prompt...' }));
      
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: { postId, aspectRatio }
      });

      if (promptError) throw new Error(`Prompt generation failed: ${promptError.message}`);

      setState(prev => ({ ...prev, progress: 'Creating image...' }));

      // Step 2: Generate image with the prompt
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image-gpt', {
        body: { 
          postId, 
          aspectRatio,
          prompt: promptData.prompt 
        }
      });

      if (imageError) throw new Error(`Image generation failed: ${imageError.message}`);

      setState(prev => ({ ...prev, progress: 'Complete!' }));

      // Refresh the UI by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      toast.success('Image generated successfully!');
      
      return { success: true, imageUrl: imageData.imageUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error('Image generation failed', { description: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      // Clear generating state after a brief delay to show completion
      setTimeout(() => {
        setState({ isGenerating: false, progress: '', error: null });
      }, 1000);
    }
  }, [queryClient]);

  const generateAllImages = useCallback(async (postId: string) => {
    setState({ isGenerating: true, progress: 'Generating all image sizes...', error: null });

    try {
      const { data, error } = await supabase.functions.invoke('generate-all-images-optimized', {
        body: { postId }
      });

      if (error) throw new Error(error.message);

      // Refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      toast.success(`Generated ${data.imagesGenerated} images successfully!`);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error('Batch generation failed', { description: errorMessage });
      throw error;
    } finally {
      setTimeout(() => {
        setState({ isGenerating: false, progress: '', error: null });
      }, 1000);
    }
  }, [queryClient]);

  return {
    ...state,
    generateImage,
    generateAllImages
  };
}