import type { AspectRatio } from './bulkImageGeneration';

export interface AspectRatioOption {
  label: string;
  value: AspectRatio;
}

export interface ImagePromptConfig {
  title: string;
  systemPrompt: string;
  edgeFunction: 'generate-content' | 'create-single-image-prompt' | 'generate-hero-job-visual' | 'generate-job-context-visual';
  theme?: string;
  themeId?: string;
  category?: string;
  enableCaching?: boolean;
  aspectRatioOptions?: AspectRatioOption[];
  cacheKeyPrefix?: string;
  fixedAspectRatio?: AspectRatio;
}

export interface ImagePromptContent {
  postId?: string;
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface ReferenceImageAnalysis {
  colors?: {
    dominant: string[];
    palette: string[];
    mood: string;
    temperature: 'warm' | 'cool' | 'neutral';
  };
  composition?: {
    layout: string;
    balance: string;
    focalPoints: string[];
    visualFlow: string;
  };
  style?: {
    artistic: string;
    technique: string;
    aesthetic: string;
    complexity: 'minimal' | 'moderate' | 'complex';
  };
  lighting?: {
    quality: string;
    direction: string;
    mood: string;
    intensity: 'soft' | 'moderate' | 'dramatic';
  };
  mood?: {
    overall: string;
    emotional: string;
    professional: boolean;
  };
  elements?: {
    subjects: string[];
    objects: string[];
    environment: string;
  };
}

export interface ExtractedCharacteristics {
  colorPalette: string[];
  dominantColors: string[];
  colorMood: string;
  compositionStyle: string;
  artisticStyle: string;
  lightingMood: string;
  overallMood: string;
  complexity: 'minimal' | 'moderate' | 'complex';
  professional: boolean;
}

export interface ImagePromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImagePromptConfig;
  content: ImagePromptContent;
  cachedPrompt?: string;
  onPromptGenerated?: (prompt: string) => void;
  referenceAnalysis?: ReferenceImageAnalysis;
  extractedCharacteristics?: ExtractedCharacteristics;
}