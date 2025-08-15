// Import-specific types and validation schemas

// Re-export validation schemas from themeImportStrict
export { 
  ThemePostSchema, 
  ThemeImportDataSchema 
} from '../themeImportStrict';

export type { 
  ThemePost, 
  ThemeImportData,
  ValidationError 
} from '../themeImportStrict';

// Import the types for local use
import type { ThemePost, ThemeImportData } from '../themeImportStrict';

// Import Processing States (moved from themeImportStrict)
export type ProcessingState = 
  | { type: 'idle' }
  | { type: 'processing'; step: 'validation' | 'ai' | 'import' }
  | { type: 'success'; data: ThemeImportData }
  | { type: 'error'; error: string };

// Import Progress (moved from themeImportStrict)
export interface ImportProgress {
  step: 'validating' | 'processing' | 'importing';
  progress: number;
  message: string;
}

// Processing Result (moved from themeImportStrict)
export interface ProcessingResult {
  success: boolean;
  data?: ThemeImportData;
  insertedCount?: number;
  errors: readonly string[];
  warnings: readonly string[];
  fixes?: readonly string[];
  idempotencyKey?: string;
  themeId?: string;
  message?: string;
}

// Interface for RPC response from insert_category_content
export interface ImportRpcResponse {
  inserted_count: number;
  theme_id: string | null;
}

// Hook Options
export interface UseThemeImportOptions {
  onImportComplete?: () => void;
  onStateChange?: (state: ProcessingState) => void;
}

// Hook Return Type
export interface UseThemeImportReturn {
  // State
  state: ProcessingState;
  progress: ImportProgress | null;
  validationResult: ProcessingResult | null;
  isProcessing: boolean;
  canImport: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  
  // Actions
  validateInput: (input: string) => ProcessingResult;
  processWithAI: (input: string) => void;
  importData: () => void;
  reset: () => void;
  
  // Raw mutations for advanced usage
  aiProcessMutation: any;
  importMutation: any;
}

// Import Strategy Types
export interface ImportStrategy {
  type: 'json' | 'csv' | 'manual';
  validateInput: (input: string) => ProcessingResult;
  processData: (input: any) => Promise<ProcessingResult>;
  importData: (data: any) => Promise<ProcessingResult>;
}

// Batch Import Types
export interface BatchImportItem {
  id: string;
  category: string;
  theme: string;
  posts: ThemePost[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface BatchImportResult {
  totalItems: number;
  successful: number;
  failed: number;
  items: BatchImportItem[];
  errors: string[];
}

// Import Validation Types
export interface ImportValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface ImportValidationSchema {
  rules: ImportValidationRule[];
  allowExtraFields: boolean;
  strictMode: boolean;
}

// Import Analytics Types
export interface ImportAnalytics {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  averageProcessingTime: number;
  lastImportDate: Date;
  topCategories: string[];
  errorPatterns: { error: string; count: number }[];
}

// Data Transformation Types
export interface DataTransformation {
  sourceFormat: 'json' | 'csv' | 'xml';
  targetFormat: 'theme_import_data';
  transformationRules: TransformationRule[];
}

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transformer?: (value: any) => any;
  required: boolean;
  defaultValue?: any;
}

// Re-export for backwards compatibility
export type { ProcessingState as ImportProcessingState } from '../themeImportStrict';