import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ThemeValidationService } from '@/services/themeValidationService';
import { supabase } from '@/integrations/supabase/client';
import { triggerSystemPromptGeneration } from '@/utils/systemPromptTrigger';
import { useNavigate } from 'react-router-dom';
import type { ProcessingState, ProcessingResult, ThemeImportData, ImportProgress, UseThemeImportOptions, ImportRpcResponse } from '@/types/stories/import';

// UseThemeImportOptions now imported from types/stories/import

export const useThemeImport = (options: UseThemeImportOptions = {}) => {
  const [state, setState] = useState<ProcessingState>({ type: 'idle' });
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [validationResult, setValidationResult] = useState<ProcessingResult | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      
      const response = await supabase.functions.invoke('structure-theme-input', {
        body: { text: typeof data === 'string' ? data : JSON.stringify(data) }
      });

      if (response.error || !response.data?.success || !response.data?.data) {
        throw new Error(response.error?.message || response.data?.errors?.join(', ') || 'Failed to structure input');
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
      console.log('🚀 [useThemeImport] Starting import mutation');
      console.log('📊 [useThemeImport] Data to import:', data);
      console.log('🏷️ [useThemeImport] Category:', data.category);
      console.log('📝 [useThemeImport] Posts count:', data.posts.length);
      
      setProgress({ step: 'importing', progress: 70, message: 'Importing to database...' });
      
      // Optional: Check for existing categories (removed to allow dynamic categories)
      // const { data: existingPosts } = await supabase
      //   .from('social_media_posts')
      //   .select('category')
      //   .eq('category', data.category)
      //   .limit(1);

      // if (existingPosts && existingPosts.length > 0) {
      //   throw new Error(`Category '${data.category}' already exists`);
      // }

      // Convert posts for database insertion
      const postsForDb = data.posts.map(post => ({
        ...post,
        status: post.status || 'draft'
      }));

      console.log('🔄 [useThemeImport] Converted posts for DB:', postsForDb);

      // Insert using RPC with theme_id_param
      console.log('💾 [useThemeImport] Calling insert_category_content RPC');
      const { data: rpcResponse, error } = await supabase
        .rpc('insert_category_content', {
          category_name: data.category,
          posts_data: postsForDb,
          theme_description_param: data.theme_description,
          theme_id_param: null // This hook doesn't create themes, so theme_id is null
        });

      console.log('📥 [useThemeImport] RPC response:', { rpcResponse, error });

      if (error) {
        console.log('❌ [useThemeImport] RPC error:', error);
        throw error;
      }

      const typedResponse = rpcResponse as unknown as ImportRpcResponse;
      const insertedCount = typedResponse?.inserted_count || 0;
      const themeId = typedResponse?.theme_id;
      
      console.log('✅ [useThemeImport] Import successful, inserted count:', insertedCount, 'theme_id:', themeId);

      return {
        success: true,
        data,
        insertedCount,
        themeId,
        errors: [],
        warnings: [],
      };
    },
    onMutate: () => {
      updateState({ type: 'processing', step: 'import' });
    },
    onSuccess: async (result) => {
      updateState({ type: 'idle' });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
      queryClient.invalidateQueries({ queryKey: ['available-categories'] });
      
      let systemPromptStatus = '';
      
      // Automatically trigger system prompt generation for the new category
      if (result.data?.category) {
        try {
          console.log('🚀 AUTO-TRIGGER: Starting system prompt generation for:', result.data.category);
          
          // Use background processing - don't await to avoid blocking UI
          triggerSystemPromptGeneration(result.data.category).then((promptResult) => {
            if (promptResult.success) {
              console.log('✅ AUTO-GENERATED system prompt for:', result.data.category);
              
              // Show success notification
              toast({
                title: "System prompt generated",
                description: `Automatically created system prompt for ${result.data.category}`,
              });
              
              // Invalidate system prompts query to refresh UI
              queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
            } else {
              console.log('⚠️ AUTO-GENERATION failed for:', result.data.category, promptResult.error);
              
              // Only show error if it's not "already exists"
              if (!promptResult.error?.includes('already exists')) {
                toast({
                  title: "System prompt generation failed",
                  description: `Could not auto-generate system prompt for ${result.data.category}. You can try manually later.`,
                  variant: "destructive"
                });
              }
            }
          }).catch((error) => {
            console.error('💥 AUTO-GENERATION error:', error);
          });
          
          systemPromptStatus = ' (generating system prompt...)';
        } catch (error) {
          console.error('💥 Error starting auto system prompt generation:', error);
        }
      }
      
      toast({
        title: "Import successful",
        description: `Imported ${result.insertedCount} posts successfully${systemPromptStatus}`,
      });
      
      // Navigate to theme page if theme_id is available
      if (result.themeId) {
        console.log('🧭 [useThemeImport] Navigating to theme page:', result.themeId);
        navigate(`/stories/id/${result.themeId}`);
      }
      
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
  const canImport = validationResult?.success && validationResult.data && !isProcessing;
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