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
  aspectRatioOptions?: AspectRatioOption[];
  fixedAspectRatio?: AspectRatio;
}

export interface ImagePromptContent {
  postId?: string;
  primary: string;
  secondary: string;
  tertiary?: string;
}


export interface ImagePromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImagePromptConfig;
  content: ImagePromptContent;
  onPromptGenerated?: (prompt: string) => void;
}