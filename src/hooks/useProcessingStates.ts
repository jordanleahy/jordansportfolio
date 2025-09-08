import { useState, useCallback } from 'react';
import type { AspectRatio } from '@/types/bulkImageGeneration';

// Keep original string literal type for backward compatibility
export type ProcessingOperation = 'generate' | 'bulk_generate' | 'regenerate_prompt';

interface ProcessingState {
  operation: ProcessingOperation;
  aspectRatio?: AspectRatio;
  isActive: boolean;
}

type ProcessingKey = string; // Format: ${postId}_${operation}_${aspectRatio?}

export const useProcessingStates = () => {
  const [processingStates, setProcessingStates] = useState<Map<ProcessingKey, ProcessingState>>(new Map());

  const createKey = useCallback((
    postId: string, 
    operation: ProcessingOperation, 
    aspectRatio?: AspectRatio
  ): ProcessingKey => {
    return `${postId}_${operation}${aspectRatio ? `_${aspectRatio}` : ''}`;
  }, []);

  const setProcessing = useCallback((
    postId: string,
    operation: ProcessingOperation,
    isActive: boolean,
    aspectRatio?: AspectRatio
  ) => {
    setProcessingStates(prev => {
      const newMap = new Map(prev);
      const key = createKey(postId, operation, aspectRatio);
      
      if (isActive) {
        newMap.set(key, { operation, aspectRatio, isActive });
      } else {
        newMap.delete(key);
      }
      
      return newMap;
    });
  }, [createKey]);

  const setBulkProcessing = useCallback((
    postId: string,
    isActive: boolean
  ) => {
    // Set bulk generate state
    setProcessing(postId, 'bulk_generate', isActive);
  }, [setProcessing]);

  const isProcessing = useCallback((
    postId: string,
    operation?: ProcessingOperation,
    aspectRatio?: AspectRatio
  ): boolean => {
    if (operation && aspectRatio) {
      const key = createKey(postId, operation, aspectRatio);
      const result = processingStates.get(key)?.isActive || false;
      return result;
    }
    
    if (operation) {
      // For bulk_generate, check exact key match
      if (operation === 'bulk_generate') {
        const key = createKey(postId, operation);
        const result = processingStates.get(key)?.isActive || false;
        return result;
      }
      
      const matches = Array.from(processingStates.entries())
        .filter(([key, state]) => key.startsWith(`${postId}_${operation}`) && state.isActive);
      const result = matches.length > 0;
      return result;
    }
    
    // Check any processing for the post
    const matches = Array.from(processingStates.entries())
      .filter(([key, state]) => key.startsWith(postId) && state.isActive);
    const result = matches.length > 0;
    return result;
  }, [processingStates, createKey]);


  const isGenerating = useCallback((
    postId: string
  ): boolean => {
    return isProcessing(postId, 'generate') || isProcessing(postId, 'bulk_generate');
  }, [isProcessing]);

  const isAnyImageGenerating = useCallback((): boolean => {
    const matches = Array.from(processingStates.entries())
      .filter(([key, state]) => 
        (state.operation === 'generate' || state.operation === 'bulk_generate') && 
        state.isActive
      );
    return matches.length > 0;
  }, [processingStates]);

  const clearProcessing = useCallback((postId: string) => {
    setProcessingStates(prev => {
      const newMap = new Map(prev);
      const keysToDelete = Array.from(newMap.keys()).filter(key => key.startsWith(postId));
      keysToDelete.forEach(key => newMap.delete(key));
      return newMap;
    });
  }, []);

  return {
    setProcessing,
    setBulkProcessing,
    isProcessing,
    isGenerating,
    isAnyImageGenerating,
    clearProcessing,
  };
};