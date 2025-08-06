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
  activeTab: 'draft' | 'published';
  uploadStates: UploadState[];
  creatingBlogIds: Set<string>;
  blogStatuses: Record<string, { exists: boolean; status?: string; id?: string; slug?: string; isLoading: boolean; error?: string }>;
  onStatusChange: (postId: string, newStatus: string) => void;
  onBulkStatusChange: (postIds: string[], newStatus: string) => void;
  onCopyPost: (post: SocialMediaPost) => void;
  onDeletePost: (postId: string) => void;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey, file: File) => void;
  onPreviewMedia: (post: SocialMediaPost) => void;
  onCreateBlogPost: (postId: string) => void;
  onGenerateVoiceoverScript: (postId: string) => void;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  isAdmin?: boolean;
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
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

// Blog and Status Props
export interface BlogPostButtonProps {
  post: SocialMediaPost;
  variant?: 'default' | 'outline' | 'ghost';
  onBlogGenerated?: (content: string) => void;
}

export interface BlogStatus {
  exists: boolean;
  status?: string;
  id?: string;
  slug?: string;
  isLoading: boolean;
  error?: string;
}

export interface BlogPostButtonForRowProps {
  post: SocialMediaPost;
  creatingBlogIds: Set<string>;
  onCreateBlogPost: (postId: string) => void;
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
  description?: string;
  onImageUpload: (file: File) => void;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
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
  onFileSelect: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', post: SocialMediaPost) => void;
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
  watermarkText: string;
  onWatermarked: (watermarkedFile: File) => void;
  onError: (error: string) => void;
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