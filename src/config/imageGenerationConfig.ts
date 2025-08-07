// Image Generation Configuration
// Centralized configuration for all image generation settings

export interface ImageGenerationConfig {
  // Model settings
  defaultModel: string;
  availableModels: string[];
  
  // Quality and format settings
  defaultQuality: 'high' | 'medium' | 'low' | 'auto';
  defaultOutputFormat: 'png' | 'jpeg' | 'webp';
  
  // Dimension settings
  aspectRatioConfigs: AspectRatioConfig[];
  
  // Processing settings
  maxImagesPerRequest: number;
  promptTruncationLength: number;
  
  // Cost settings
  pricing: ModelPricing;
  
  // Timeout and retry settings
  requestTimeoutMs: number;
  maxRetries: number;
}

export interface AspectRatioConfig {
  ratio: string;
  key: string;
  width: number;
  height: number;
  label: string;
  enabled: boolean;
}

export interface ModelPricing {
  [modelName: string]: {
    baseCost: number;
    qualityMultipliers: {
      high: number;
      medium: number;
      low: number;
      auto: number;
    };
    sizeMultipliers: {
      [size: string]: number;
    };
  };
}

// Default configuration
export const DEFAULT_IMAGE_CONFIG: ImageGenerationConfig = {
  defaultModel: 'gpt-image-1',
  availableModels: ['gpt-image-1'],
  
  defaultQuality: 'high',
  defaultOutputFormat: 'png',
  
  aspectRatioConfigs: [
    { ratio: '16:9', key: '16_9', width: 1792, height: 1024, label: 'Landscape (16:9)', enabled: true },
    { ratio: '9:16', key: '9_16', width: 1024, height: 1792, label: 'Portrait (9:16)', enabled: true },
    { ratio: '4:3', key: '4_3', width: 1536, height: 1024, label: 'Standard (4:3)', enabled: true },
    { ratio: '3:4', key: '3_4', width: 1024, height: 1536, label: 'Social (3:4)', enabled: true },
    { ratio: '1:1', key: '1_1', width: 1024, height: 1024, label: 'Square (1:1)', enabled: false },
  ],
  
  maxImagesPerRequest: 10,
  promptTruncationLength: 200,
  
  pricing: {
    'gpt-image-1': {
      baseCost: 0.052, // Updated 2024 pricing
      qualityMultipliers: {
        high: 1.0,
        medium: 0.8,
        low: 0.6,
        auto: 0.9,
      },
      sizeMultipliers: {
        '1024x1024': 1.0,
        '1536x1024': 1.5,
        '1024x1536': 1.5,
        '1792x1024': 2.0,
        '1024x1792': 2.0,
      }
    }
  },
  
  requestTimeoutMs: 60000, // 60 seconds
  maxRetries: 3,
};

// Helper functions
export const getAspectRatioSize = (ratio: string, config = DEFAULT_IMAGE_CONFIG): { width: number; height: number } => {
  const aspectConfig = config.aspectRatioConfigs.find(ar => ar.ratio === ratio);
  return aspectConfig ? { width: aspectConfig.width, height: aspectConfig.height } : { width: 1024, height: 1024 };
};

export const calculateImageCost = (
  model: string, 
  size: string, 
  quality: string, 
  config = DEFAULT_IMAGE_CONFIG
): number => {
  const modelPricing = config.pricing[model];
  if (!modelPricing) return 0;
  
  const baseCost = modelPricing.baseCost;
  const qualityMultiplier = modelPricing.qualityMultipliers[quality as keyof typeof modelPricing.qualityMultipliers] || 1.0;
  const sizeMultiplier = modelPricing.sizeMultipliers[size] || 1.0;
  
  return baseCost * qualityMultiplier * sizeMultiplier;
};

export const getEnabledAspectRatios = (config = DEFAULT_IMAGE_CONFIG) => {
  return config.aspectRatioConfigs.filter(ar => ar.enabled);
};

// Environment-based configuration override
export const getImageConfig = (): ImageGenerationConfig => {
  // In a real implementation, this could read from environment variables
  // or a database to allow runtime configuration changes
  return DEFAULT_IMAGE_CONFIG;
};
