import { useBulkSingleAspectGeneration } from '@/hooks/useBulkSingleAspectGeneration';
import { useMultiProviderImageGeneration } from '@/hooks/useMultiProviderImageGeneration';

/**
 * Simplified hook that provides access to single-aspect bulk generation only
 * Multi-aspect bulk generation has been removed from the application
 */
export const useOptimizedBulkGeneration = () => {
  const singleAspectBulk = useBulkSingleAspectGeneration();
  const multiProvider = useMultiProviderImageGeneration();

  return {
    // Single aspect ratio generation with mode selection
    generateSingleAspect: singleAspectBulk.generateBulkSingleAspect,
    
    // Processing states
    isGeneratingSingle: singleAspectBulk.isProcessing,
    
    // Multi-model controls
    currentImageModel: multiProvider.currentImageModel,
    setCurrentImageModel: multiProvider.setCurrentImageModel
  };
};