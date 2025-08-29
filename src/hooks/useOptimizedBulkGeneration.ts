import { useBulkSingleAspectGeneration } from '@/hooks/useBulkSingleAspectGeneration';

/**
 * Simplified hook that provides access to single-aspect bulk generation only
 * Multi-aspect bulk generation has been removed from the application
 */
export const useOptimizedBulkGeneration = () => {
  const singleAspectBulk = useBulkSingleAspectGeneration();

  return {
    // Single aspect ratio generation with mode selection
    generateSingleAspect: singleAspectBulk.generateBulkSingleAspect,
    
    // Processing states
    isGeneratingSingle: singleAspectBulk.isProcessing
  };
};