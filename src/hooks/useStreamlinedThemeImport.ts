import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessingResult } from '@/types/themeImportStrict';

interface UseStreamlinedThemeImportOptions {
  onImportComplete?: () => void;
}

export const useStreamlinedThemeImport = (options: UseStreamlinedThemeImportOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (rawJson: string): Promise<ProcessingResult> => {
      // Basic JSON validation first
      let parsedData;
      try {
        parsedData = JSON.parse(rawJson);
      } catch (error) {
        throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
      }

      // Call the combined edge function
      const response = await supabase.functions.invoke('process-and-import-theme', {
        body: { rawJson: parsedData }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onMutate: () => {
      setIsProcessing(true);
      // Show initial processing toast
      toast({
        title: "Processing...",
        description: "Processing your data with AI and importing to database",
      });
    },
    onSuccess: (result) => {
      setIsProcessing(false);
      
      if (result.success) {
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });
        queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
        
        // Show success toast with details
        const fixCount = result.fixes?.length || 0;
        const warningCount = result.warnings?.length || 0;
        
        let description = `Successfully imported ${result.insertedCount || 0} posts`;
        if (fixCount > 0) description += ` with ${fixCount} fixes applied`;
        if (warningCount > 0) description += ` (${warningCount} warnings)`;
        
        toast({
          title: "Import successful! 🎉",
          description,
        });

        // Show system prompt generation status
        if (result.data?.category) {
          setTimeout(() => {
            toast({
              title: "System prompt generated",
              description: `Auto-generated visual prompt system for "${result.data.category}"`,
            });
          }, 2000);
        }

        options.onImportComplete?.();
      } else {
        // Show error toast
        toast({
          title: "Import failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive"
      });
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

    submitMutation.mutate(rawJson);
  }, [submitMutation, toast]);

  return {
    submitRawData,
    isProcessing,
    mutation: submitMutation
  };
};