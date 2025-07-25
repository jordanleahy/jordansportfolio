export interface ThemePost {
  day?: number;
  title: string;
  description: string;
  theme?: string;
  status?: 'draft' | 'scheduled' | 'published';
}

export interface ThemeImportData {
  category: string;
  theme: string;
  description?: string;
  posts: ThemePost[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: ThemeImportData;
}

export interface ProcessingResult {
  success: boolean;
  insertedCount?: number;
  errors: string[];
  warnings: string[];
  cleanedData?: ThemeImportData;
  originalData?: any;
  fixes?: string[];
  modelUsed?: string;
  processingTimeMs?: number;
}