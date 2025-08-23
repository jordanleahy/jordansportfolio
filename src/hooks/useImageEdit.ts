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

  const enhancePromptWithReference = (basePrompt: string, referenceImageAnalysis: any) => {
    if (!referenceImageAnalysis?.extractedCharacteristics) return basePrompt;
    
    const characteristics = referenceImageAnalysis.extractedCharacteristics;
    return `${basePrompt}\n\nReference image characteristics:
- Color palette: ${characteristics.colorPalette?.join(', ')}
- Artistic style: ${characteristics.artisticStyle}
- Lighting mood: ${characteristics.lightingMood}
- Overall mood: ${characteristics.overallMood}
- Complexity: ${characteristics.complexity}`;
  };

  const enhancePromptWithAgent = async (userInput: string, referenceImageAnalysis: any) => {
    console.log('🤖 Calling Image Enhancement Agent with input:', userInput);
    
    try {
      const sourceContext = {
        title: title,
        aspectRatio: aspectRatio || '1:1'
      };

      const requestBody = {
        userInput,
        sourceContext,
        ...(referenceImageAnalysis && { referenceImageAnalysis: referenceImageAnalysis.extractedCharacteristics })
      };

      const { data, error } = await supabase.functions.invoke('image-enhancement-agent', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Enhancement agent error:', error);
        toast.error('We are in beta and have hit a bug. Please check your connection and try again.');
        return userInput;
      }

      if (data.confidence === 'low' && data.clarificationNeeded) {
        toast.warning(`Clarification needed: ${data.clarificationNeeded}`);
      } else if (data.confidence === 'high') {
        toast.success('Prompt enhanced successfully');
      }

      return data.enhancedPrompt || userInput;

    } catch (error) {
      console.error('❌ Enhancement agent failed:', error);
      toast.error('Failed to enhance prompt, using original input');
      return userInput;
    }
  };

  const handleEditSubmit = async (
    prompt: string, 
    referenceImageAnalysis: any,
    onSuccess?: () => void
  ) => {
    if (!prompt?.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const urlMatch = imageUrl.match(/generated_([a-f0-9-]+)_/) || 
                       imageUrl.match(/([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/);
      const postId = urlMatch?.[1];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const enhancedPrompt = await enhancePromptWithAgent(prompt, referenceImageAnalysis);
      const finalPrompt = enhancePromptWithReference(enhancedPrompt, referenceImageAnalysis);

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt: finalPrompt, 
          imageUrl, 
          aspectRatio,
          postId,
          userId: user?.id
        }
      });
      
      if (error) throw new Error("We are in beta and have hit a bug. Please check your connection and try again.");
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
        toast.error('We are in beta and have hit a bug. Please check your connection and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleEditSubmit,
    enhancePromptWithReference,
    enhancePromptWithAgent
  };
};