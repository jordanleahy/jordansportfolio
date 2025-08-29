import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaPost } from '@/types/socialMedia';
import { useMultiProviderImageGeneration, ImageProvider } from './useMultiProviderImageGeneration';

interface GenerationOptions {
  aspectRatio?: string;
  seed?: number | null;
  useDeterministicSeed?: boolean;
  useManagedSeed?: boolean;
  managedSeedCategory?: string | null;
  seedContext?: string | null;
  category?: string | null;
  provider?: ImageProvider;
}

interface GenerationResult {
  success: boolean;
  image?: string;
  aspectRatio?: string;
  error?: string;
  message?: string;
  currentStatus?: string;
  provider?: ImageProvider;
  processingTimeMs?: number;
  usage?: {
    estimated_cost: number;
  };
}

export const useConcurrencyControlledImageGeneration = () => {
  const multiProvider = useMultiProviderImageGeneration();
  const { toast } = useToast();

  const generateImage = useCallback(async (
    post: SocialMediaPost,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    // Use multi-provider hook for enhanced functionality
    return multiProvider.generateImage(post, options);
  }, [multiProvider]);

  const checkImageStatus = multiProvider.checkImageStatus;
  const canGenerateImage = multiProvider.canGenerateImage;

  return {
    generateImage,
    checkImageStatus,
    canGenerateImage,
    isGenerating: multiProvider.isGenerating,
    currentProvider: multiProvider.currentProvider,
    setCurrentProvider: multiProvider.setCurrentProvider
  };
};