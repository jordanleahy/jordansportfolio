export interface ColorTheme {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  is_default: boolean;
  is_system: boolean;
  
  // Core color properties
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
  
  // Additional theme properties
  color_instructions: string;
  visual_style: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateColorTheme {
  name: string;
  slug: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
  color_instructions: string;
  visual_style: string;
}

export interface UpdateColorTheme extends Partial<CreateColorTheme> {
  id: string;
}

export const SYSTEM_COLOR_THEMES = {
  DEFAULT: 'default',
  BLACK_WHITE: 'black-white',
  HEALTHCARE: 'healthcare',
  CORPORATE: 'corporate',
} as const;

export const VISUAL_STYLES = {
  MODERN: 'modern',
  MINIMALIST: 'minimalist',
  HEALTHCARE: 'healthcare',
  CORPORATE: 'corporate',
  CREATIVE: 'creative',
} as const;