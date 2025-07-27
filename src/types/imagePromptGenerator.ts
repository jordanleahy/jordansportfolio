export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface AspectRatioOption {
  label: string;
  value: AspectRatio;
}

export interface ImagePromptConfig {
  title: string;
  systemPrompt: string;
  edgeFunction: 'generate-content' | 'generate-image-prompt-dynamic' | 'generate-hero-job-visual' | 'generate-job-context-visual';
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