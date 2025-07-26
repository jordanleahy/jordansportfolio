import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ThemeValidationService } from '@/services/themeValidationService';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessingState, ProcessingResult, ThemeImportData, ImportProgress } from '@/types/themeImportStrict';

interface UseThemeImportOptions {
  onImportComplete?: () => void;
  onStateChange?: (state: ProcessingState) => void;
}

export const useThemeImport = (options: UseThemeImportOptions = {}) => {
  const [state, setState] = useState<ProcessingState>({ type: 'idle' });
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [validationResult, setValidationResult] = useState<ProcessingResult | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update state and call callback
  const updateState = useCallback((newState: ProcessingState) => {
    setState(newState);
    options.onStateChange?.(newState);
  }, [options]);

  // Validate input data locally
  const validateInput = useCallback((input: string): ProcessingResult => {
    setProgress({ step: 'validating', progress: 10, message: 'Validating input...' });
    
    try {
      const parsed = JSON.parse(input);
      const result = ThemeValidationService.validateThemeData(parsed);
      setValidationResult(result);
      return result;
    } catch (error) {
      const result: ProcessingResult = {
        success: false,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
      setValidationResult(result);
      return result;
    }
  }, []);

  // AI processing mutation
  const aiProcessMutation = useMutation({
    mutationFn: async (data: unknown): Promise<ProcessingResult> => {
      setProgress({ step: 'processing', progress: 30, message: 'Processing with AI...' });
      
      const response = await supabase.functions.invoke('process-theme-json', {
        body: { rawJson: data }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onMutate: () => {
      updateState({ type: 'processing', step: 'ai' });
    },
    onSuccess: (result) => {
      setValidationResult(result);
      if (result.success && result.data) {
        updateState({ type: 'success', data: result.data });
        toast({
          title: "Processing completed",
          description: `Applied ${result.fixes?.length || 0} fixes`,
        });
      } else {
        updateState({ type: 'error', error: result.errors.join(', ') });
        toast({
          title: "Processing failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
      setProgress(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateState({ type: 'error', error: errorMessage });
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive"
      });
      setProgress(null);
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (data: ThemeImportData): Promise<ProcessingResult> => {
      setProgress({ step: 'importing', progress: 70, message: 'Importing to database...' });
      
      // Check for existing categories
      const { data: existingPosts } = await supabase
        .from('social_media_posts')
        .select('category')
        .eq('category', data.category)
        .limit(1);

      if (existingPosts && existingPosts.length > 0) {
        throw new Error(`Category '${data.category}' already exists`);
      }

      // Convert posts for database insertion
      const postsForDb = data.posts.map(post => ({
        ...post,
        status: post.status || 'draft'
      }));

      // Insert using RPC
      const { data: insertCount, error } = await supabase
        .rpc('insert_category_content', {
          category_name: data.category,
          posts_data: postsForDb
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        insertedCount: insertCount || 0,
        errors: [],
        warnings: [],
      };
    },
    onMutate: () => {
      updateState({ type: 'processing', step: 'import' });
    },
    onSuccess: (result) => {
      updateState({ type: 'idle' });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      
      toast({
        title: "Import successful",
        description: `Imported ${result.insertedCount} posts successfully`,
      });
      
      options.onImportComplete?.();
      setProgress(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateState({ type: 'error', error: errorMessage });
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
      setProgress(null);
    }
  });

  // Process with AI
  const processWithAI = useCallback((input: string) => {
    try {
      const parsed = JSON.parse(input);
      aiProcessMutation.mutate(parsed);
    } catch (error) {
      updateState({ 
        type: 'error', 
        error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }, [aiProcessMutation, updateState]);

  // Import validated data
  const importData = useCallback(() => {
    if (validationResult?.success && validationResult.data) {
      importMutation.mutate(validationResult.data);
    }
  }, [validationResult, importMutation]);

  // Reset state
  const reset = useCallback(() => {
    setState({ type: 'idle' });
    setValidationResult(null);
    setProgress(null);
  }, []);

  // Computed values
  const isProcessing = aiProcessMutation.isPending || importMutation.isPending;
  const canImport = validationResult?.success && validationResult.data && state.type !== 'processing';
  const hasErrors = validationResult && !validationResult.success;
  const hasWarnings = validationResult && validationResult.warnings.length > 0;

  return {
    // State
    state,
    progress,
    validationResult,
    isProcessing,
    canImport,
    hasErrors,
    hasWarnings,
    
    // Actions
    validateInput,
    processWithAI,
    importData,
    reset,
    
    // Raw mutations for advanced usage
    aiProcessMutation,
    importMutation,
  };
};