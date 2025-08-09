import React, { createContext, useContext } from 'react';
import { useProcessingStates } from '@/hooks/useProcessingStates';

// Define the context type based on the hook's return
interface ProcessingStatesContextValue {
  setProcessing: (postId: string, operation: 'generate' | 'bulk_generate', isActive: boolean, aspectRatio?: import('@/types/bulkImageGeneration').AspectRatio) => void;
  setBulkProcessing: (postId: string, isActive: boolean) => void;
  isProcessing: (postId: string, operation?: 'generate' | 'bulk_generate', aspectRatio?: import('@/types/bulkImageGeneration').AspectRatio) => boolean;
  isGenerating: (postId: string) => boolean;
  clearProcessing: (postId: string) => void;
}

const ProcessingStatesContext = createContext<ProcessingStatesContextValue | null>(null);

export const ProcessingStatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useProcessingStates();
  return (
    <ProcessingStatesContext.Provider value={value}>
      {children}
    </ProcessingStatesContext.Provider>
  );
};

export const useProcessingStatesContext = () => {
  const ctx = useContext(ProcessingStatesContext);
  if (!ctx) {
    throw new Error('useProcessingStatesContext must be used within a ProcessingStatesProvider');
  }
  return ctx;
};
