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