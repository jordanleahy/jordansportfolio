import { useState, useCallback } from 'react';
import type { AspectRatio } from '@/types/bulkImageGeneration';

export type ProcessingOperation = 'upload' | 'generate' | 'bulk_generate';

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
    console.log(`🔄 [ProcessingStates] Setting ${operation} for post ${postId}${aspectRatio ? ` (${aspectRatio})` : ''}: ${isActive}`);
    
    setProcessingStates(prev => {
      const newMap = new Map(prev);
      const key = createKey(postId, operation, aspectRatio);
      
      if (isActive) {
        newMap.set(key, { operation, aspectRatio, isActive });
      } else {
        newMap.delete(key);
      }
      
      console.log(`🔄 [ProcessingStates] Current states for post ${postId}:`, 
        Array.from(newMap.entries())
          .filter(([k]) => k.startsWith(postId))
          .map(([k, v]) => ({ key: k, ...v }))
      );
      
      return newMap;
    });
  }, [createKey]);

  const setBulkProcessing = useCallback((
    postId: string,
    isActive: boolean,
    aspectRatios: AspectRatio[] = ['16:9', '4:3', '9:16', '3:4']
  ) => {
    console.log(`🔄 [ProcessingStates] Setting bulk processing for post ${postId}: ${isActive}`);
    
    // Set individual aspect ratio states for shimmer effects
    aspectRatios.forEach(aspectRatio => {
      setProcessing(postId, 'upload', isActive, aspectRatio);
    });
    
    // Also set bulk generate state
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

  const isUploading = useCallback((
    postId: string,
    aspectRatio?: AspectRatio
  ): boolean => {
    return isProcessing(postId, 'upload', aspectRatio);
  }, [isProcessing]);

  const isGenerating = useCallback((
    postId: string
  ): boolean => {
    return isProcessing(postId, 'generate') || isProcessing(postId, 'bulk_generate');
  }, [isProcessing]);

  const getUploadType = useCallback((
    postId: string
  ): AspectRatio | null => {
    const uploadStates = Array.from(processingStates.entries())
      .filter(([key, state]) => 
        key.startsWith(`${postId}_upload_`) && state.isActive && state.aspectRatio
      );
    
    const result = uploadStates[0]?.[1]?.aspectRatio || null;
    console.log(`🔍 [ProcessingStates] Get upload type for ${postId}: ${result}`);
    return result;
  }, [processingStates]);

  const clearProcessing = useCallback((postId: string) => {
    console.log(`🧹 [ProcessingStates] Clearing all processing states for post ${postId}`);
    
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
    isUploading,
    isGenerating,
    getUploadType,
    clearProcessing,
  };
};