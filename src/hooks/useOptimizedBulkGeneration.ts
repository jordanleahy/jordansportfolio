import { useBulkSingleAspectGeneration } from '@/hooks/useBulkSingleAspectGeneration';

/**
 * Hook for single-aspect bulk generation only.
 * Multi-aspect bulk generation (generateAllImages) has been removed.
 * Use individual aspect generation via GenerateImage components instead.
 */
export const useOptimizedBulkGeneration = () => {
  const singleAspectBulk = useBulkSingleAspectGeneration();

  return {
    // Single aspect ratio generation with mode selection
    generateSingleAspect: singleAspectBulk.generateBulkSingleAspect,
    isGeneratingSingle: singleAspectBulk.isProcessing,
    // Note: other properties removed as they don't exist on the actual hook
  };
};