import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImageEdit = (
  imageUrl: string, 
  aspectRatio?: string, 
  title?: string,
  fetchVersionsFromDatabase?: (postId: string, aspectRatio: string) => Promise<void>,
  imageVersions?: Array<{id: string, url: string, prompt?: string, version_number: number}>,
  setImageVersions?: (versions: any) => void,
  setCurrentVersionIndex?: (index: any) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);


  const handleEditSubmit = async (
    prompt: string,
    _referenceImageAnalysis: any,
    onSuccess?: () => void
  ) => {
    if (!prompt?.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const urlMatch = imageUrl.match(/generated_([a-f0-9-]+)_/) || 
                       imageUrl.match(/([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/);
      const postId = urlMatch?.[1];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the prompt as-is without enhancement
      const enhancedPrompt = prompt;

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt: enhancedPrompt, 
          imageUrl, 
          aspectRatio,
          postId,
          userId: user?.id
        }
      });
      
      if (error) throw error;
      const newUrl = (data as any)?.url as string | undefined;
      if (newUrl) {
        if (postId && user?.id && fetchVersionsFromDatabase) {
          await fetchVersionsFromDatabase(postId, aspectRatio || '1:1');
        } else if (imageVersions && setImageVersions && setCurrentVersionIndex) {
          const newVersion = {
            id: `edit-${Date.now()}`,
            url: newUrl,
            prompt: prompt.trim(),
            version_number: imageVersions.length
          };
          setImageVersions((prev: any) => [...prev, newVersion]);
          setCurrentVersionIndex((prev: any) => prev + 1);
        }
        
        onSuccess?.();
        toast.success('Edit complete');
      } else {
        toast.error('No image returned');
      }
    } catch (err: any) {
      console.error('Edit failed:', err);
      
      const errorMessage = err?.message || '';
      if (errorMessage.includes('safety system') || errorMessage.includes('moderation')) {
        toast.error('Edit blocked by content safety system. Try rephrasing your request or use different wording.');
      } else if (errorMessage.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        toast.error('Edit failed. Please try again with different wording.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleEditSubmit
  };
};