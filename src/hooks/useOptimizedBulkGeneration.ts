import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useBulkSingleAspectGeneration } from '@/hooks/useBulkSingleAspectGeneration';

/**
 * Consolidated hook that provides access to both multi-aspect and single-aspect bulk generation
 * This replaces the need for multiple separate hooks and provides a unified interface
 */
export const useOptimizedBulkGeneration = () => {
  const multiAspectBulk = useBulkImageGeneration();
  const singleAspectBulk = useBulkSingleAspectGeneration();

  return {
    // Multi-aspect ratio generation (1:1, 16:9, 9:16, 4:3, 3:4)
    generateAllImages: multiAspectBulk.generateAllImages,
    
    // Single aspect ratio generation with mode selection
    generateSingleAspect: singleAspectBulk.generateBulkSingleAspect,
    
    // Processing states
    isGeneratingMulti: multiAspectBulk.isGenerating,
    isGeneratingSingle: singleAspectBulk.isProcessing,
    
    // Progress tracking
    multiProgress: multiAspectBulk.progress,
    
    // Error handling
    error: multiAspectBulk.error,
    
    // Utility functions
    getExistingPrompt: multiAspectBulk.getExistingPrompt,
    clearCache: multiAspectBulk.clearCache
  };
};