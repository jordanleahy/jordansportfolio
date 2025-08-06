// UI component prop interfaces and state types

import type { SocialMediaPost } from '@/types/socialMedia';
import type { ThemeWithPosts, StreamingProgress } from './domain';

// Component Props Interfaces
export interface CategoriesGridProps {
  themes: ThemeWithPosts[];
  onDeleteCategory: (category: string) => void;
}

export interface CategoryCardProps {
  theme: string;
  themeDescription?: string | null;
  category: string;
  postCount: number;
  imageUrl?: string;
  firstPostData?: {
    title: string;
    description: string;
  };
  onClick?: () => void;
  onDelete?: (category: string) => void;
  isShimmer?: boolean;
}

export interface PostCardProps {
  post: SocialMediaPost;
  onGenerateImages?: (post: SocialMediaPost) => void;
  onViewPrompt?: (post: SocialMediaPost) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}

export interface PostsTableProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void | Promise<void>;
  isAdmin?: boolean;
  category?: string;
  selectedThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export interface PostsTableViewProps {
  posts: SocialMediaPost[];
  searchTerm?: string;
  filterStatus?: string;
  onSearchChange?: (term: string) => void;
  onFilterChange?: (status: string) => void;
}

export interface ThemeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export interface ThemeImportModalOptimizedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateTheme: (description: string) => Promise<void>;
  isGenerating?: boolean;
}

export interface JsonImportDialogProps {
  onImportComplete: () => void;
}

// Form and Input Types
export interface ThemeDescriptionInput {
  value: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
}

export interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
}

// UI State Types
export interface PendingTheme {
  theme_name: string;
  description: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
}

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string;
}

// Modal Props
export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
}

export interface ImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
  onPromptGenerated?: (prompt: string) => void;
}

export interface StoryTellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
  storyType?: 'childrens_story' | 'convincing_story';
}

export interface SystemPromptViewerProps {
  category: string;
  isOpen: boolean;
  onClose: () => void;
}

// Image Generation Props
export interface BulkImageGenerationButtonProps {
  post: SocialMediaPost;
  onGenerationStart?: () => void;
  onGenerationComplete?: (urls: string[]) => void;
  disabled?: boolean;
}

export interface BulkGenerationThumbnailsProps {
  showThumbnails: boolean;
  className?: string;
}

export interface SingleAspectRatioSelectorProps {
  post: SocialMediaPost;
  selectedRatio?: string;
  onRatioChange?: (ratio: string) => void;
}

// Blog and Status Props
export interface BlogPostButtonProps {
  post: SocialMediaPost;
  variant?: 'default' | 'outline' | 'ghost';
  onBlogGenerated?: (content: string) => void;
}

export interface BlogPostButtonForRowProps {
  post: SocialMediaPost;
  compact?: boolean;
}

export interface BlogStatusBadgeProps {
  postId: string;
  status: string;
  showIcon?: boolean;
}

// Upload and Media Props
export interface ImageUploadCardProps {
  title: string;
  description?: string;
  onImageUpload: (file: File) => void;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
}

export interface PostImageUploadCardProps {
  post: SocialMediaPost;
  onImageUploaded?: (imageUrl: string) => void;
}

export interface VideoUploadCardProps {
  title: string;
  description?: string;
  onVideoUpload: (file: File) => void;
  maxSizeInMB?: number;
}

export interface PostMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
}

// Color Theme Props
export interface ColorThemeManagerProps {
  trigger?: React.ReactNode;
  onThemeSelected?: (theme: any) => void;
}

export interface ColorThemeSelectorProps {
  themes: any[];
  selectedTheme?: string;
  onThemeSelect: (themeId: string) => void;
}

export interface ColorThemeConsistencyCheckerProps {
  category: string;
  onInconsistencyFound?: (issues: string[]) => void;
}

// Watermark Props
export interface ImageWatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile?: File;
  onWatermarkedImage?: (file: File) => void;
}

export interface WatermarkCanvasProps {
  file: File;
  watermarkText?: string;
  onWatermarked?: (file: File) => void;
}

// Pipeline and Progress Props
export interface PipelineProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress?: number;
  currentStep?: string;
  error?: string;
}

export interface BatchProcessingSkeletonProps {
  isGenerating: boolean;
  itemCount?: number;
}

// Story Telling Props
export interface StoryTellingSetupPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  post: SocialMediaPost;
  onStoryGenerated?: (story: string) => void;
}

export interface StoryTellingReadPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  storyContent: string;
  onBack?: () => void;
}

// Individual Prompt Viewer Props
export interface IndividualPromptViewerProps {
  post: SocialMediaPost | null;
  isOpen: boolean;
  onClose: () => void;
}

// Streaming Hook Props
export interface UseThemeImageStreamingProps {
  category: string;
  enabled?: boolean;
}

// Hook Return Types
export interface UseThemeImageStreamingReturn {
  streamingProgress: StreamingProgress | null;
  isGenerating: boolean;
  error: string | null;
  hasTimedOut: boolean;
  startStreaming: (firstPostData?: any) => Promise<void>;
  retryGeneration: () => Promise<void>;
}