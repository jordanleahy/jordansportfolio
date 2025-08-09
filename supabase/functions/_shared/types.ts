// ============= SHARED TYPES FOR EDGE FUNCTIONS =============

// ============= STATUS ENUMS =============

export type PostStatus = 'draft' | 'scheduled' | 'published';

export type ImageGenerationStatus = 'none' | 'pending' | 'generating' | 'complete' | 'failed';

export type AgentStatus = 'active' | 'paused' | 'deprecated';

// ============= CONFIGURATION INTERFACES =============

export interface OpenAIConfig {
  readonly MODELS: {
    readonly FLAGSHIP: string;
    readonly FAST: string;
    readonly REASONING: string;
    readonly REASONING_FAST: string;
    readonly VISION: string;
    readonly LEGACY_GPT4O: string;
    readonly LEGACY_GPT4O_MINI: string;
  };
  readonly MAX_COMPLETION_TOKENS: {
    readonly SHORT_RESPONSE: number;
    readonly MEDIUM_RESPONSE: number;
    readonly LONG_RESPONSE: number;
    readonly COMPREHENSIVE: number;
  };
  readonly DEFAULT_THEME_MODEL: string;
  readonly DEFAULT_THEME_MAX_COMPLETION_TOKENS: number;
}

export interface ImageConfig {
  readonly MODEL: string;
  readonly SIZE: string;
  readonly QUALITY: string;
  readonly PROMPT_MAX_LENGTH: number;
}

export interface DatabaseConfig {
  readonly TABLES: {
    readonly SOCIAL_MEDIA_POSTS: string;
    readonly OPENAI_AGENTS: string;
    readonly CACHED_PROMPTS: string;
  };
  readonly STORAGE: {
    readonly BUCKETS: {
      readonly USER_UPLOADS: string;
    };
  };
  readonly DEFAULT_POST_COUNT: number;
  readonly SAMPLE_POSTS_COUNT: number;
}

export interface ContentConfig {
  readonly THEME: {
    readonly MAX_LENGTH: number;
    readonly MIN_LENGTH: number;
  };
  readonly TITLE: {
    readonly MAX_LENGTH: number;
    readonly MIN_LENGTH: number;
  };
  readonly DESCRIPTION: {
    readonly MAX_LENGTH: number;
    readonly MIN_LENGTH: number;
    readonly OPTIMAL_LENGTH: number;
    readonly SUBSTRING_PREVIEW: number;
  };
  readonly PROMPT: {
    readonly PREVIEW_LENGTH: number;
    readonly MAX_LENGTH: number;
  };
  readonly POSTS: {
    readonly DEFAULT_COUNT: number;
    readonly SAMPLE_COUNT: number;
    readonly DAY_RANGE: {
      readonly MIN: number;
      readonly MAX: number;
    };
  };
}

// ============= PROGRESS STEP TYPES =============

export type ProgressStepType = 
  | 'theme_generation_start'
  | 'theme_generation_complete'
  | 'database_import_start'
  | 'database_import_complete'
  | 'system_prompt_start'
  | 'system_prompt_complete'
  | 'posts_status_update'
  | 'posts_status_updated'
  | 'background_trigger_start'
  | 'background_trigger_complete'
  | 'pipeline_complete'
  | 'pipeline_error';

export interface ProgressStepConfig {
  readonly THEME_GENERATION_START: number;
  readonly THEME_GENERATION_COMPLETE: number;
  readonly DATABASE_IMPORT_START: number;
  readonly DATABASE_IMPORT_COMPLETE: number;
  readonly SYSTEM_PROMPT_START: number;
  readonly SYSTEM_PROMPT_COMPLETE: number;
  readonly POSTS_STATUS_UPDATE: number;
  readonly POSTS_STATUS_UPDATED: number;
  readonly BACKGROUND_TRIGGER_START: number;
  readonly BACKGROUND_TRIGGER_COMPLETE: number;
  readonly PIPELINE_COMPLETE: number;
}

// ============= REQUEST/RESPONSE INTERFACES =============

export interface ImageRequest {
  theme: string;
  category: string;
  userId: string;
  firstPostTitle?: string;
  firstPostDescription?: string;
}

export interface UserIdeaRequest {
  description: string;
  stream?: boolean;
}

export interface StreamingEvent {
  type: ProgressStepType;
  progress: number;
  data?: {
    status?: string;
    theme?: string;
    category?: string;
    postCount?: number;
    insertedCount?: number;
    promptGenerated?: boolean;
    success?: boolean;
    message?: string;
    backgroundProcessing?: boolean;
  };
  error?: string;
}

// ============= DATA STRUCTURES =============

export interface ThemeData {
  category: string;
  theme: string;
  theme_description: string;
  posts: ThemePost[];
}

export interface ThemePost {
  day: number;
  title: string;
  description: string;
}

export interface PostInsertData {
  day: number;
  title: string;
  description: string;
  theme_id: string;
  category: string;
  user_id: string;
  status: PostStatus;
}

// ============= SUPABASE CLIENT TYPE =============

export interface SupabaseClient {
  from: (table: string) => any;
  storage: any;
  functions: any;
  auth: any;
}

// ============= ERROR TYPES =============

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export interface PipelineError extends Error {
  step?: ProgressStepType;
  progress?: number;
  data?: any;
}

// ============= FUNCTION RESULT TYPES =============

export interface ThemeGenerationResult {
  success: boolean;
  data?: ThemeData;
  error?: APIError;
}

export interface DatabaseImportResult {
  success: boolean;
  insertedCount?: number;
  error?: APIError;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: APIError;
}

export interface PipelineResult {
  success: boolean;
  category?: string;
  theme?: string;
  postCount?: number;
  message?: string;
  backgroundProcessing?: boolean;
  error?: string;
}