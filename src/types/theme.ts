export interface Theme {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTheme {
  name: string;
  description?: string;
  category: string;
}

export interface UpdateTheme extends Partial<CreateTheme> {
  id: string;
}