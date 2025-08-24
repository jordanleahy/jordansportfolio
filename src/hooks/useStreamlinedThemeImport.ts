import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessingResult } from '@/types/themeImportStrict';

interface UseStreamlinedThemeImportOptions {
  onImportComplete?: () => void;
  onOptimisticStart?: (categoryName: string) => void;
  onOptimisticComplete?: (success: boolean, categoryName?: string, themeId?: string) => void;
}

export const useStreamlinedThemeImport = (options: UseStreamlinedThemeImportOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async ({ rawJson, categoryName, idempotencyKey, characterData }: { 
      rawJson: string; 
      categoryName: string;
      idempotencyKey: string;
      characterData?: {
        reference_character_id: string;
        reference_character_analysis: any;
        has_character_reference: boolean;
      };
    }): Promise<ProcessingResult & { categoryName: string; duplicate?: boolean }> => {
      console.log('🚀 FRONTEND: Starting streamlined theme import');
      console.log('📋 IMPORT DETAILS:', {
        categoryName,
        dataLength: rawJson.length,
        idempotencyKey,
        hasCharacterReference: !!characterData?.has_character_reference,
        timestamp: new Date().toISOString()
      });
      
      // Parse rawJson and add character data if present
      const parsedJson = JSON.parse(rawJson);
      if (characterData) {
        Object.assign(parsedJson, characterData);
      }
      
      // Call the combined edge function
      console.log('📡 CALLING: process-and-import-theme edge function');
      const response = await supabase.functions.invoke('process-and-import-theme', {
        body: { 
          rawJson: parsedJson,
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

        // Theme imported successfully - now background processing begins
        console.log('✅ Theme imported, starting background prompt generation:', result.themeId);

        options.onOptimisticComplete?.(true, result.categoryName, result.themeId);
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

  const submitRawData = useCallback(async (rawJson: string, providedIdempotencyKey?: string) => {
    console.log('📥 FRONTEND: Submit raw data called');
    console.log('📊 RAW DATA STATS:', {
      hasData: !!rawJson.trim(),
      dataLength: rawJson.length,
      hasIdempotencyKey: !!providedIdempotencyKey,
      timestamp: new Date().toISOString()
    });
    
    if (!rawJson.trim()) {
      console.log('❌ NO DATA: Empty raw JSON/text provided');
      toast({
        title: "No data provided",
        description: "Please paste your text or JSON first",
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

    // Try to extract a friendly category/theme for optimistic UI
    let categoryName = 'New Theme';
    try {
      const parsed = JSON.parse(rawJson);
      categoryName = parsed.category || parsed.theme || 'New Theme';
      console.log('📋 EXTRACTED CATEGORY:', categoryName);
    } catch (parseError) {
      console.log('ℹ️ Input is not valid JSON; will structure with AI');
    }

    // Add to pending submissions and start processing
    setPendingSubmissions(prev => new Set(prev).add(idempotencyKey));
    console.log('🚀 STARTING MUTATION:', { categoryName, processing: true, idempotencyKey });
    setIsProcessing(true);
    options.onOptimisticStart?.(categoryName);

    try {
      // Always structure input via edge function for strict schema enforcement
      const { data, error } = await supabase.functions.invoke('structure-theme-input', {
        body: { text: rawJson }
      });
      if (error || !data?.success || !data?.data) {
        throw new Error(error?.message || data?.errors?.join(', ') || 'Failed to structure input');
      }
      const finalJsonString = JSON.stringify(data.data);
      categoryName = data.data.category || data.data.theme || categoryName;

      // Pass through character reference data if detected
      const characterData = data.data.character_analysis ? {
        reference_character_id: data.data.character_analysis.id,
        reference_character_analysis: data.data.character_analysis,
        has_character_reference: true
      } : undefined;

      submitMutation.mutate({ 
        rawJson: finalJsonString, 
        categoryName, 
        idempotencyKey,
        characterData 
      });
    } catch (err) {
      setIsProcessing(false);
      // Clear pending submission
      setPendingSubmissions(prev => {
        const updated = new Set(prev);
        updated.delete(idempotencyKey);
        return updated;
      });
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ PREPROCESS FAILURE:', msg);
      toast({ title: 'Preprocess failed', description: msg, variant: 'destructive' });
      options.onOptimisticComplete?.(false, categoryName);
    }
  }, [submitMutation, toast, options, pendingSubmissions]);

  return {
    submitRawData,
    isProcessing: isProcessing || pendingSubmissions.size > 0,
    mutation: submitMutation
  };
};
