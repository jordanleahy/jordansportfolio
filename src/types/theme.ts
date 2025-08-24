export interface Theme {
  id: string;
  user_id: string;
  theme_name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
  visual_prompt_system_prompt_id?: string;
  prompt_generation_status?: 'not_started' | 'in_progress' | 'completed';
  prompt_completion_count?: number;
  total_posts_count?: number;
  lifecycle_status?: 'pending' | 'generating' | 'ready' | 'completed';
  user_interaction_required?: boolean;
  background_processing_complete?: boolean;
  reference_character_id?: string;
  reference_character_analysis?: any;
  has_character_reference?: boolean;
}

export interface CreateTheme {
  theme_name: string;
  description?: string;
  category: string;
  reference_character_id?: string;
  reference_character_analysis?: any;
  has_character_reference?: boolean;
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

// UI types moved to src/types/stories/domain.ts
// Import from there: import { PendingTheme, ThemeDescriptionInput } from '@/types/stories';