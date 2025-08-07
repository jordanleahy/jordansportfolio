// UI component prop interfaces and state types

import type { SocialMediaPost } from '@/types/socialMedia';
import type { ThemeWithPosts, StreamingProgress } from './domain';
import type { AspectRatioKey } from '@/types/bulkImageGeneration';
import type { SubscriptionTier } from '@/hooks/useSubscriptionStatus';
import type { ColorTheme } from '@/types/colorTheme';

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
  draftIndex?: number;
  onCopy: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onGeneratePrompt: (post: SocialMediaPost) => void;
  onGenerateVoiceover?: (post: SocialMediaPost) => void;
  onVideoUpload: (postId: string, url: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onVideoRemove: (postId: string, type: '16_9_video' | '3_4_video' | 'general_video') => void;
  onImageDelete: (postId: string, type: '16_9' | '9_16' | '3_4' | '4_3') => void;
  onImageGenerated: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', imageUrl: string) => void;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  onPostsChange?: () => void;
  processingStates: {
    [key: string]: boolean;
  };
  completingPosts?: Set<string>;
  isGenerating: (postId: string, aspectRatio?: '16_9' | '9_16' | '3_4' | '4_3') => boolean;
  isAdmin?: boolean;
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
  activeTab: 'draft' | 'published';
  creatingBlogIds: Set<string>;
  onStatusChange: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => void;
  onCopyContent: (post: SocialMediaPost) => void;
  onDeletePost: (postId: string) => void;
  onCreateBlogPost: (post: SocialMediaPost) => void;
  onGenerateVoiceoverScript: (post: SocialMediaPost) => void;
  onGenerateImagePrompt: (post: SocialMediaPost) => void;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  onPreviewImage: (url: string, alt: string) => void;
  onPostsChange: () => void;
  isAdmin?: boolean;
  animatingRows?: Set<string>;
  completingRows?: Set<string>;
  getRowAnimationClass?: (postId: string) => string;
  blogStatuses?: Record<string, BlogStatus>;
  isProcessing?: (postId: string, operation?: 'generate' | 'bulk_generate', aspectRatio?: AspectRatioKey) => boolean;
}

export interface UploadState {
  postId: string;
  aspectRatio: AspectRatioKey;
  isUploading: boolean;
  file?: File;
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
  onOptimisticStart?: (categoryName: string) => void;
  onOptimisticComplete?: (success: boolean, categoryName?: string) => void;
}

export interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
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
  imageUrl: string;
  imageAlt: string;
  title?: string;
  aspectRatio?: string;
}

export interface ImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  postId: string;
  cachedPrompt?: string | null;
  category?: string;
}

// Subscription Component Props
export interface MobileSubscriptionBarProps {
  isVisible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
  currentUsage?: {
    percentage: number;
    feature: string;
  };
}

export interface MobileCheckoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier;
  onSubscribe: (tierId: string) => Promise<void>;
  isLoading?: boolean;
}

export interface PlanCarouselProps {
  tiers: SubscriptionTier[];
  currentTier?: string | null;
  onSelectPlan: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
}

export interface QuickSubscribeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier;
  onSubscribe: (tierId: string) => Promise<void>;
  isLoading?: boolean;
}

export interface MobilePlanComparisonProps {
  tiers: SubscriptionTier[];
  currentTier?: string | null;
  onSelectPlan: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
}

export interface SystemPromptViewerProps {
  category: string;
  theme?: string;
  isVisible: boolean;
  onClose: () => void;
  selectedThemeId?: string;
  themes?: ColorTheme[];
  onThemeChange?: (themeId: string) => void;
}

// Image Generation Props
export interface BulkImageGenerationButtonProps {
  post: SocialMediaPost;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export interface BulkGenerationThumbnailsProps {
  showThumbnails: boolean;
  className?: string;
}

export interface SingleAspectRatioSelectorProps {
  post: SocialMediaPost;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
  isProcessing?: (postId: string, operation?: 'generate' | 'bulk_generate', aspectRatio?: AspectRatioKey) => boolean;
}

// Blog and Status Props
export interface BlogPostButtonProps {
  post: SocialMediaPost;
  variant?: 'default' | 'outline' | 'ghost';
  onBlogGenerated?: (content: string) => void;
}

export interface BlogStatus {
  exists: boolean;
  status?: 'draft' | 'published';
  id?: string;
  slug?: string;
  isLoading: boolean;
  error?: string;
}

export interface BlogPostButtonForRowProps {
  post: SocialMediaPost;
  creatingBlogIds: Set<string>;
  onCreateBlogPost: (post: SocialMediaPost) => void;
  blogStatus?: BlogStatus;
}

export interface BlogStatusBadgeProps {
  postId: string;
  className?: string;
  blogStatus?: BlogStatus;
}

// Upload and Media Props
export interface ImageUploadCardProps {
  title: string;
  aspectRatio: string;
  displayAspectRatio?: string;
  imageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  postData?: {
    id: string;
    title: string;
    description: string;
    category?: string;
  };
}

export interface VideoUploadCardProps {
  title: string;
  aspectRatio: string;
  videoUrl?: string;
  onVideoUpload: (url: string) => void;
  onVideoRemove: () => void;
}

export interface PostImageUploadCardProps {
  post: SocialMediaPost;
  type: '16_9' | '9_16' | '3_4' | '4_3';
  label: string;
  imageUrl?: string;
  isUploading: boolean;
  onImageDelete?: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3') => void;
  onImageGenerated: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', imageUrl: string) => void;
}

export interface PostMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  aspectRatio: string;
  label: string;
}

// Color Theme Props
export interface ColorThemeManagerProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface ColorThemeSelectorProps {
  themes: ColorTheme[];
  selectedThemeId?: string;
  onThemeChange: (themeId: string) => void;
  showAddOption?: boolean;
  onAddTheme?: () => void;
  className?: string;
}

export interface ColorThemeConsistencyCheckerProps {
  category: string;
}

// Watermark Props
export interface ImageWatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (watermarkedFile: File) => void;
  watermarkText?: string;
}

export interface WatermarkCanvasProps {
  file: File;
  watermarkText: string;
  onWatermarked: (watermarkedFile: File) => void;
  onError: (error: string) => void;
}

// Pipeline and Progress Props
export interface PipelineProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: number;
  currentStage: string;
  isProcessing: boolean;
  error: string | null;
  result: any | null;
}

export interface BatchProcessingSkeletonProps {
  isGenerating: boolean;
  progress: {
    completed: number;
    total: number;
    currentAspectRatio?: string;
    isProcessing?: boolean;
    isFinalizing?: boolean;
  };
  className?: string;
}

// Story Telling Props
export interface StoryTellingSetupPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  setStoryType: (type: 'childrens_story' | 'convincing_story') => void;
  post: {
    id: string;
    title: string;
    description: string;
    theme?: string;
    category?: string;
  };
  onGenerateScript: () => void;
  isGenerating: boolean;
}

export interface StoryTellingReadPageProps {
  storyType: 'childrens_story' | 'convincing_story';
  generatedScript: string;
  post: {
    title: string;
    theme?: string;
    category?: string;
  };
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export interface StoryTellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    description: string;
    theme?: string;
    category?: string;
  };
}

// Individual Prompt Viewer Props
export interface IndividualPromptViewerProps {
  post: SocialMediaPost | null;
  isVisible: boolean;
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