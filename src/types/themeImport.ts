export interface ThemePost {
  day?: number;
  title: string;
  description: string;
  status?: 'draft' | 'scheduled' | 'published';
}

export interface ThemeImportData {
  category: string;
  theme: string;
  description?: string;
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