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
      console.log('🚀 FRONTEND: Starting streamlined theme import');
      console.log('📋 IMPORT DETAILS:', {
        categoryName,
        dataLength: rawJson.length,
        timestamp: new Date().toISOString()
      });
      
      // Start the minimum shimmer duration timer
      const startTime = Date.now();
      const MINIMUM_SHIMMER_DURATION = 1500; // 1.5 seconds
      
      // Call the combined edge function
      console.log('📡 CALLING: process-and-import-theme edge function');
      const response = await supabase.functions.invoke('process-and-import-theme', {
        body: { rawJson: JSON.parse(rawJson) }
      });

      console.log('📡 EDGE FUNCTION RESPONSE:', {
        hasError: !!response.error,
        hasData: !!response.data,
        errorMessage: response.error?.message
      });

      if (response.error) {
        console.error('❌ EDGE FUNCTION ERROR:', response.error);
        throw new Error(response.error.message);
      }

      // Ensure minimum shimmer duration
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SHIMMER_DURATION - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`⏳ SHIMMER DELAY: Waiting ${remainingTime}ms to ensure visible loading state`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      console.log('✅ EDGE FUNCTION SUCCESS:', {
        success: response.data?.success,
        insertedCount: response.data?.insertedCount,
        category: response.data?.data?.category
      });

      return { ...response.data, categoryName };
    },
    onSuccess: (result) => {
      console.log('✅ MUTATION SUCCESS:', {
        success: result.success,
        insertedCount: result.insertedCount,
        categoryName: result.categoryName,
        errorCount: result.errors?.length || 0
      });
      
      setIsProcessing(false);
      
      if (result.success) {
        console.log('🔄 INVALIDATING QUERIES: Refreshing UI data');
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
        console.log('❌ IMPORT FAILED:', result.errors);
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
    console.log('📥 FRONTEND: Submit raw data called');
    console.log('📊 RAW DATA STATS:', {
      hasData: !!rawJson.trim(),
      dataLength: rawJson.length,
      timestamp: new Date().toISOString()
    });
    
    if (!rawJson.trim()) {
      console.log('❌ NO DATA: Empty raw JSON provided');
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
      console.log('📋 EXTRACTED CATEGORY:', categoryName);
    } catch (parseError) {
      console.log('⚠️ CATEGORY EXTRACTION FAILED:', parseError.message);
      // Use default if parsing fails
    }

    console.log('🚀 STARTING MUTATION:', { categoryName, processing: true });
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