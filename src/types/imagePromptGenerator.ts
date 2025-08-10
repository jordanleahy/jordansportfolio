import type { AspectRatio } from './bulkImageGeneration';

export interface AspectRatioOption {
  label: string;
  value: AspectRatio;
}

export interface ImagePromptConfig {
  title: string;
  systemPrompt: string;
  edgeFunction: 'generate-content' | 'generate-image-prompt-dynamic' | 'generate-hero-job-visual' | 'generate-job-context-visual';
  theme?: string;
  category?: string;
  enableCaching?: boolean;
  aspectRatioOptions?: AspectRatioOption[];
  cacheKeyPrefix?: string;
  fixedAspectRatio?: AspectRatio;
}

export interface ImagePromptContent {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface ImagePromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImagePromptConfig;
  content: ImagePromptContent;
  cachedPrompt?: string;
  onPromptGenerated?: (prompt: string) => void;
}