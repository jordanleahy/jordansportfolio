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