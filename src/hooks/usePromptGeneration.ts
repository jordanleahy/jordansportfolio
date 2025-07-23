
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreatePrompt, useLogPromptUsage } from './useEnhancedPrompts';
import { useToast } from '@/hooks/use-toast';

export const usePromptGeneration = () => {
  const createPrompt = useCreatePrompt();
  const logUsage = useLogPromptUsage();
  const { toast } = useToast();

  const generateAndCachePrompt = useMutation({
    mutationFn: async ({
      functionName,
      parameters,
      category,
      promptType = 'image_generation',
      sourceTable,
      sourceId,
    }: {
      functionName: string;
      parameters: any;
      category: string;
      promptType?: string;
      sourceTable?: string;
      sourceId?: string;
    }) => {
      const startTime = Date.now();
      
      try {
        // Call the appropriate edge function
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: parameters,
        });

        if (error) throw error;

        const executionTime = Date.now() - startTime;
        const generatedPrompt = data.generatedPrompt;

        // Create cache key from parameters
        const cacheKey = `${functionName}_${JSON.stringify(parameters)}`.substring(0, 100);

        // Cache the generated prompt
        await createPrompt.mutateAsync({
          cache_key: cacheKey,
          prompt_text: generatedPrompt,
          category,
          prompt_type: promptType as any,
          source_table: sourceTable,
          source_id: sourceId,
          metadata: {
            function_name: functionName,
            parameters,
            execution_time_ms: executionTime,
            generated_at: new Date().toISOString(),
          },
        });

        return {
          ...data,
          cached: true,
          executionTime,
        };
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // Log the failed usage
        console.error('Prompt generation failed:', error);
        
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Prompt Generated & Cached",
        description: "Your prompt has been generated and saved to the library.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate and cache the prompt.",
        variant: "destructive",
      });
    },
  });

  const useGeneratedPrompt = useMutation({
    mutationFn: async ({
      promptId,
      context,
    }: {
      promptId: string;
      context?: any;
    }) => {
      const startTime = Date.now();
      
      try {
        // Log the usage
        await logUsage.mutateAsync({
          prompt_id: promptId,
          success: true,
          execution_time_ms: Date.now() - startTime,
          context_data: context,
        });

        return { success: true };
      } catch (error) {
        await logUsage.mutateAsync({
          prompt_id: promptId,
          success: false,
          execution_time_ms: Date.now() - startTime,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          context_data: context,
        });
        
        throw error;
      }
    },
  });

  return {
    generateAndCachePrompt,
    useGeneratedPrompt,
    isGenerating: generateAndCachePrompt.isPending,
    isLogging: useGeneratedPrompt.isPending,
  };
};
