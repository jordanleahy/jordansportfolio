// Core business domain types for stories/themes functionality

export interface Theme {
  id: string;
  user_id: string;
  theme_name: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTheme {
  theme_name: string;
  description?: string;
  category: string;
}

export interface UpdateTheme extends Partial<CreateTheme> {
  id: string;
}

export interface ThemeWithPosts {
  id: string;
  theme_name: string;
  description: string | null;
  category: string;
  cover_image_url?: string;
  post_count: number;
  prompt_generation_status?: 'not_started' | 'in_progress' | 'completed';
  prompt_completion_count?: number;
  total_posts_count?: number;
  lifecycle_status?: 'pending' | 'generating' | 'ready' | 'completed';
  user_interaction_required?: boolean;
  background_processing_complete?: boolean;
  first_post: {
    id: string;
    title: string;
    description: string;
    day?: number;
    image_url?: string;
    image_16_9_url?: string;
    image_4_3_url?: string;
    image_9_16_url?: string;
    image_3_4_url?: string;
    image_1_1_url?: string;
    image_16_9_status?: string;
    image_4_3_status?: string;
    image_9_16_status?: string;
    image_3_4_status?: string;
    image_1_1_status?: string;
  } | null;
}

// Post-related domain types
export interface CategoryPost {
  id: string;
  title: string;
  description: string;
  category: string;
  day?: number;
  image_url?: string;
  status: 'draft' | 'scheduled' | 'published';
  theme_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Theme generation types
export interface ThemeGeneration {
  id: string;
  theme_name: string;
  description: string;
  category: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message?: string;
}

// Image streaming types
export interface StreamingProgress {
  stage: string; // Allow any string for flexibility with partial stages
  progress: number;
  imageUrl?: string;
  partialImage?: string;
  isPartial?: boolean;
  previousImage?: string;
  prompt?: string;
}

// UI types that were previously in theme.ts
export interface PendingTheme {
  theme_id?: string;  // Added for precise theme matching
  theme_name: string;
  description: string;
}

export interface ThemeDescriptionInput {
  value: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
}