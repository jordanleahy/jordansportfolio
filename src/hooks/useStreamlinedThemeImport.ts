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
  const [pendingSubmissions, setPendingSubmissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async ({ rawJson, categoryName, idempotencyKey }: { 
      rawJson: string; 
      categoryName: string;
      idempotencyKey: string;
    }): Promise<ProcessingResult & { categoryName: string; duplicate?: boolean }> => {
      console.log('🚀 FRONTEND: Starting streamlined theme import');
      console.log('📋 IMPORT DETAILS:', {
        categoryName,
        dataLength: rawJson.length,
        idempotencyKey,
        timestamp: new Date().toISOString()
      });
      
      // Call the combined edge function
      console.log('📡 CALLING: process-and-import-theme edge function');
      const response = await supabase.functions.invoke('process-and-import-theme', {
        body: { 
          rawJson: JSON.parse(rawJson),
          idempotencyKey
        }
      });

      console.log('📡 EDGE FUNCTION RESPONSE:', {
        hasError: !!response.error,
        hasData: !!response.data,
        errorMessage: response.error?.message,
        idempotencyKey: response.data?.idempotencyKey,
        themeId: response.data?.themeId
      });

      if (response.error) {
        console.error('❌ EDGE FUNCTION ERROR:', response.error);
        throw new Error(response.error.message);
      }

      console.log('✅ EDGE FUNCTION SUCCESS:', {
        success: response.data?.success,
        insertedCount: response.data?.insertedCount,
        category: response.data?.data?.category,
        idempotencyKey: response.data?.idempotencyKey,
        themeId: response.data?.themeId
      });

      return { ...response.data, categoryName };
    },
    onSuccess: (result) => {
      console.log('✅ MUTATION SUCCESS:', {
        success: result.success,
        insertedCount: result.insertedCount,
        categoryName: result.categoryName,
        errorCount: result.errors?.length || 0,
        idempotencyKey: result.idempotencyKey,
        themeId: result.themeId
      });
      
      setIsProcessing(false);
      
      if (result.success) {
        console.log('🔄 INVALIDATING QUERIES: Refreshing UI data');
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });
        queryClient.invalidateQueries({ queryKey: ['system-prompts'] });
        
        // Clear pending submission
        setPendingSubmissions(prev => {
          const updated = new Set(prev);
          updated.delete(result.idempotencyKey);
          return updated;
        });

        // Simplified messaging: no duplicate-specific branch
        const title = "Theme imported successfully! 🎉";
        const description = `${result.insertedCount || 0} posts imported`;
        
        toast({
          title,
          description,
        });

        options.onOptimisticComplete?.(true, result.categoryName);
        options.onImportComplete?.();
      } else {
        console.log('❌ IMPORT FAILED:', result.errors);
        const errorMessage = result.errors?.join(', ') || 'Import failed';
        toast({
          title: "Import failed",
          description: errorMessage,
          variant: "destructive"
        });
        options.onOptimisticComplete?.(false, result.categoryName);
      }
    },
    onError: (error, variables) => {
      setIsProcessing(false);
      
      // Clear pending submission
      setPendingSubmissions(prev => {
        const updated = new Set(prev);
        updated.delete(variables.idempotencyKey);
        return updated;
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.log('❌ MUTATION ERROR:', {
        error: errorMessage,
        categoryName: variables.categoryName,
        idempotencyKey: variables.idempotencyKey
      });
      
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      options.onOptimisticComplete?.(false, variables.categoryName);
    }
  });

  const submitRawData = useCallback((rawJson: string, providedIdempotencyKey?: string) => {
    console.log('📥 FRONTEND: Submit raw data called');
    console.log('📊 RAW DATA STATS:', {
      hasData: !!rawJson.trim(),
      dataLength: rawJson.length,
      hasIdempotencyKey: !!providedIdempotencyKey,
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

    // Generate idempotency key if not provided (UUID + timestamp for uniqueness)
    const idempotencyKey = providedIdempotencyKey || `${crypto.randomUUID()}-${Date.now()}`;

    // Check for duplicate submission
    if (pendingSubmissions.has(idempotencyKey)) {
      console.log('⚠️ DUPLICATE SUBMISSION BLOCKED:', idempotencyKey);
      toast({
        title: "Submission in progress",
        description: "This request is already being processed",
        variant: "default"
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

    // Add to pending submissions
    setPendingSubmissions(prev => new Set(prev).add(idempotencyKey));

    console.log('🚀 STARTING MUTATION:', { 
      categoryName, 
      processing: true, 
      idempotencyKey 
    });
    setIsProcessing(true);
    options.onOptimisticStart?.(categoryName);
    
    submitMutation.mutate({ rawJson, categoryName, idempotencyKey });
  }, [submitMutation, toast, options]);

  return {
    submitRawData,
    isProcessing: isProcessing || pendingSubmissions.size > 0,
    mutation: submitMutation
  };
};
