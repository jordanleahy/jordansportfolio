import { z } from 'zod';

// Zod schemas for runtime validation
export const ThemePostSchema = z.object({
  day: z.number().int().min(1).max(365).optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
});

export const ThemeImportDataSchema = z.object({
  category: z.string().min(1).max(100),
  theme: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  posts: z.array(ThemePostSchema).min(1).max(200),
});

// TypeScript types derived from schemas
export type ThemePost = z.infer<typeof ThemePostSchema>;
export type ThemeImportData = z.infer<typeof ThemeImportDataSchema>;

// Processing state as discriminated union
export type ProcessingState = 
  | { type: 'idle' }
  | { type: 'processing'; step: 'validation' | 'ai' | 'import' }
  | { type: 'success'; data: ThemeImportData }
  | { type: 'error'; error: string };

// Improved result type with better error handling
export interface ProcessingResult {
  success: boolean;
  data?: ThemeImportData;
  insertedCount?: number;
  errors: readonly string[];
  warnings: readonly string[];
  fixes?: readonly string[];
}

// Validation error type for better error handling
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ImportProgress {
  step: 'validating' | 'processing' | 'importing';
  progress: number;
  message: string;
}