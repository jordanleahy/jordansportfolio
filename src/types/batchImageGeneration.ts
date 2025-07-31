// Type definitions for batch image generation
export type AspectRatio = '16:9' | '9:16' | '4:3' | '3:4';
export type AspectRatioKey = '16_9' | '9_16' | '4_3' | '3_4';

export interface AspectRatioConfig {
  ratio: AspectRatio;
  key: AspectRatioKey;
  width: number;
  height: number;
  label: string;
}

export interface GenerationResult {
  aspectRatio: AspectRatio;
  url?: string;
  prompt?: string;
  fileName?: string;
  success: boolean;
  error?: string;
  cost: number;
  tokens: number;
}

export interface BatchGenerationRequest {
  postId: string;
  title: string;
  description: string;
  category?: string;
}

export interface BatchGenerationResponse {
  success: boolean;
  results: GenerationResult[];
  failures: GenerationResult[];
  totalCost: number;
  totalTokens: number;
  imagesGenerated: number;
  processingTimeMs: number;
  aspectRatiosProcessed: number;
}

export interface OptimizedBatchGenerationHook {
  generateAllImages: (request: BatchGenerationRequest) => Promise<BatchGenerationResponse>;
  isGenerating: (postId: string) => boolean;
  progress: {
    completed: number;
    total: number;
    currentAspectRatio?: AspectRatio;
  };
  error: string | null;
  getOrGeneratePrompt: (request: BatchGenerationRequest) => Promise<string>;
  clearCache: () => void;
}

// Utility function to convert between aspect ratio formats
export const convertAspectRatio = {
  toKey: (ratio: AspectRatio): AspectRatioKey => ratio.replace(':', '_') as AspectRatioKey,
  toRatio: (key: AspectRatioKey): AspectRatio => key.replace('_', ':') as AspectRatio,
};

// Constants for aspect ratio configurations
export const ASPECT_RATIO_CONFIGS: AspectRatioConfig[] = [
  { ratio: '16:9', key: '16_9', width: 1792, height: 1024, label: 'Landscape (16:9)' },
  { ratio: '9:16', key: '9_16', width: 1024, height: 1792, label: 'Portrait (9:16)' },
  { ratio: '4:3', key: '4_3', width: 1536, height: 1024, label: 'Standard (4:3)' },
  { ratio: '3:4', key: '3_4', width: 1024, height: 1536, label: 'Social (3:4)' },
];