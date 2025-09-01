// Event handler types and realtime payload types

import type { SocialMediaPost } from '@/types/socialMedia';

// Realtime Event Payloads
export interface PostInsertEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  theme_id?: string;
  user_id: string;
  status: 'draft' | 'scheduled' | 'published';
  day?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PostUpdateEvent {
  id: string;
  changes: Partial<SocialMediaPost>;
  old_record?: Partial<SocialMediaPost>;
  new_record?: SocialMediaPost;
  eventType: 'UPDATE';
  table: 'social_media_posts';
  schema: 'public';
}

export interface ThemeInsertEvent {
  id: string;
  theme_name: string;
  description?: string;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeUpdateEvent {
  id: string;
  changes: {
    theme_name?: string;
    description?: string;
    category?: string;
    visual_prompt_system_prompt_id?: string;
    updated_at: string;
  };
  old_record?: any;
  new_record?: any;
}

// Event Handler Types
export type PostInsertEventHandler = (payload: PostInsertEvent) => void;
export type PostUpdateEventHandler = (payload: PostUpdateEvent) => void;
export type ThemeInsertEventHandler = (payload: ThemeInsertEvent) => void;
export type ThemeUpdateEventHandler = (payload: ThemeUpdateEvent) => void;

// Generic realtime event handler
export type RealtimeEventHandler<T> = (payload: T) => void;

// Component Event Handlers
export interface PostEventHandlers {
  onPostCreate?: (post: SocialMediaPost) => void;
  onPostUpdate?: (post: SocialMediaPost) => void;
  onPostDelete?: (postId: string) => void;
  onPostStatusChange?: (postId: string, status: string) => void;
}

export interface ThemeEventHandlers {
  onThemeCreate?: (theme: any) => void;
  onThemeUpdate?: (theme: any) => void;
  onThemeDelete?: (themeId: string) => void;
  onCategoryDelete?: (category: string) => void;
  onSystemPromptReady?: (themeId: string) => void;
}

export interface ImageGenerationEventHandlers {
  onGenerationStart?: (postId: string) => void;
  onGenerationProgress?: (postId: string, progress: number) => void;
  onGenerationComplete?: (postId: string, imageUrl: string) => void;
  onGenerationError?: (postId: string, error: string) => void;
}

// Form Event Types
export interface FormSubmissionEvent {
  formType: 'theme_creation' | 'post_creation' | 'import' | 'custom_theme';
  data: any;
  timestamp: Date;
}

export interface ValidationErrorEvent {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Toast/Notification Event Types
export interface NotificationEvent {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Connection Event Types
export interface ConnectionEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: Date;
  details?: string;
}

// Unified Realtime Props
export interface UnifiedRealtimeProps {
  enabled: boolean;
  userId?: string;
  onPostInsert?: PostInsertEventHandler;
  onPostUpdate?: PostUpdateEventHandler;
  onThemeInsert?: ThemeInsertEventHandler;
  onThemeUpdate?: ThemeUpdateEventHandler;
  onConnectionChange?: (event: ConnectionEvent) => void;
}