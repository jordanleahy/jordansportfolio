// Core business domain types for stories/themes functionality

export interface Theme {
  id: string;
  user_id: string;
  theme_name: string;
  description?: string;
  category: string;
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
  post_count: number;
  first_post: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
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
  theme_name: string;
  description: string;
}

export interface ThemeDescriptionInput {
  value: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
}