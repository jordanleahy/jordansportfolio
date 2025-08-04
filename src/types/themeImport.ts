export interface ThemePost {
  day?: number;
  title: string;
  story_description: string;
  status?: 'draft' | 'scheduled' | 'published';
}

export interface ThemeImportData {
  category: string;
  theme: string;
  theme_description?: string;
  posts: ThemePost[];
}

export interface ProcessingResult {
  success: boolean;
  insertedCount?: number;
  errors: string[];
  warnings: string[];
  cleanedData?: ThemeImportData;
  fixes?: string[];
}