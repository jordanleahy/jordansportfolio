import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessingResult } from '@/types/themeImportStrict';

interface UseStreamlinedThemeImportOptions {
  onImportComplete?: () => void;
  onOptimisticStart?: (categoryName: string) => void;
  onOptimisticComplete?: (success: boolean, categoryName?: string) => void;
}

export const useStreamlinedThemeImport = (options: UseStreamlinedThemeImportOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async ({ rawJson, categoryName }: { rawJson: string; categoryName: string }): Promise<ProcessingResult & { categoryName: string }> => {
      // Call the combined edge function
      const response = await supabase.functions.invoke('process-and-import-theme', {
        body: { rawJson: JSON.parse(rawJson) }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { ...response.data, categoryName };
    },
    onSuccess: (result) => {
      setIsProcessing(false);
      
      if (result.success) {
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });
        queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
        
        toast({
          title: "Theme imported successfully! 🎉",
          description: `${result.insertedCount || 0} posts imported`,
        });

        options.onOptimisticComplete?.(true, result.categoryName);
        options.onImportComplete?.();
      } else {
        toast({
          title: "Import failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
        options.onOptimisticComplete?.(false, result.categoryName);
      }
    },
    onError: (error, variables) => {
      setIsProcessing(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      options.onOptimisticComplete?.(false, variables.categoryName);
    }
  });

  const submitRawData = useCallback((rawJson: string) => {
    if (!rawJson.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your JSON data first",
        variant: "destructive"
      });
      return;
    }

    // Extract category name for optimistic UI
    let categoryName = 'New Theme';
    try {
      const parsed = JSON.parse(rawJson);
      categoryName = parsed.category || parsed.theme || 'New Theme';
    } catch {
      // Use default if parsing fails
    }

    setIsProcessing(true);
    options.onOptimisticStart?.(categoryName);
    
    submitMutation.mutate({ rawJson, categoryName });
  }, [submitMutation, toast, options]);

  return {
    submitRawData,
    isProcessing,
    mutation: submitMutation
  };
};