import React, { createContext, useContext, useEffect } from 'react';
import { useImageGenerationTimer } from '@/hooks/useImageGenerationTimer';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';

interface ImageGenerationTimerContextValue {
  isRunning: boolean;
  secondsRemaining: number;
  isExpired: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const ImageGenerationTimerContext = createContext<ImageGenerationTimerContextValue | null>(null);

export const ImageGenerationTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timer = useImageGenerationTimer();
  const { isAnyImageGenerating } = useProcessingStatesContext();
  
  // Auto-manage timer globally based on any image generation activity
  useEffect(() => {
    const hasActiveGeneration = isAnyImageGenerating();
    
    if (hasActiveGeneration && !timer.isRunning) {
      timer.startTimer();
    } else if (!hasActiveGeneration && timer.isRunning) {
      timer.stopTimer();
    }
  }, [isAnyImageGenerating, timer.isRunning, timer.startTimer, timer.stopTimer]);
  
  return (
    <ImageGenerationTimerContext.Provider value={timer}>
      {children}
    </ImageGenerationTimerContext.Provider>
  );
};

export const useImageGenerationTimerContext = () => {
  const context = useContext(ImageGenerationTimerContext);
  if (!context) {
    throw new Error('useImageGenerationTimerContext must be used within an ImageGenerationTimerProvider');
  }
  return context;
};