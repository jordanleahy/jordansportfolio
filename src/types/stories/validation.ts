// TypeScript strict validation types for theme ID enforcement

// Brand type to ensure theme IDs are used instead of theme names
export type ThemeId = string & { readonly __brand: 'ThemeId' };
export type ThemeName = string & { readonly __brand: 'ThemeName' };

// Type guards for runtime validation
export function isValidThemeId(value: string): value is ThemeId {
  // Theme IDs should be UUIDs (36 characters with hyphens)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

export function assertThemeId(value: string): ThemeId {
  if (!isValidThemeId(value)) {
    throw new Error(`Invalid theme ID format: ${value}. Expected UUID format.`);
  }
  return value as ThemeId;
}

// Removed cache validation types - no longer needed

// Strict theme-related interfaces
export interface StrictTheme {
  id: ThemeId;
  user_id: string;
  theme_name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface StrictThemeWithPosts {
  id: ThemeId;
  theme_name: string;
  description: string | null;
  category: string;
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

// Removed migration validation types - no longer needed

// Validation error types
export class ThemeValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_THEME_ID' | 'LEGACY_THEME_NAME_USAGE',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ThemeValidationError';
  }
}