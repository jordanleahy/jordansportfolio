// ============= SHARED CONFIGURATION CONSTANTS =============

// OpenAI API Configuration
export const OPENAI_CONFIG = {
  MODELS: {
    FLAGSHIP: 'gpt-5-mini',
    FAST: 'gpt-5-mini',
    REASONING: 'o3-2025-04-16',
    VISION: 'gpt-5-mini',
    // Legacy models (deprecated)
    LEGACY_GPT4O: 'gpt-4o',
    LEGACY_GPT4O_MINI: 'gpt-4o-mini',
  },
  MAX_COMPLETION_TOKENS: {
    SHORT_RESPONSE: 500,
    MEDIUM_RESPONSE: 2000,
    LONG_RESPONSE: 4000, // Increased from 2500
    COMPREHENSIVE: 6000, // Increased from 4000
  },
  // Default model for theme generation (gpt-5-mini launched Aug 7, 2025)
  DEFAULT_THEME_MODEL: 'gpt-5-mini',
  DEFAULT_THEME_MAX_COMPLETION_TOKENS: 6000, // Increased from 4000
} as const;

// Image Generation Configuration
export const IMAGE_CONFIG = {
  MODEL: 'gpt-image-1',
  SIZE: '1024x1024',
  QUALITY: 'high',
  PROMPT_MAX_LENGTH: 1000,
} as const;

// Progress Step Percentages for Streaming Pipeline
export const PROGRESS_STEPS = {
  THEME_GENERATION_START: 10,
  THEME_GENERATION_COMPLETE: 20,
  DATABASE_IMPORT_START: 25,
  DATABASE_IMPORT_COMPLETE: 40,
  SYSTEM_PROMPT_START: 45,
  SYSTEM_PROMPT_COMPLETE: 60,
  POSTS_STATUS_UPDATE: 70,
  POSTS_STATUS_UPDATED: 80,
  BACKGROUND_TRIGGER_START: 85,
  BACKGROUND_TRIGGER_COMPLETE: 90,
  PIPELINE_COMPLETE: 100,
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  TABLES: {
    SOCIAL_MEDIA_POSTS: 'social_media_posts',
    OPENAI_AGENTS: 'openai_agents',
    CACHED_PROMPTS: 'cached_prompts',
  },
  STORAGE: {
    BUCKETS: {
      USER_UPLOADS: 'user-uploads',
    },
  },
  DEFAULT_POST_COUNT: 10,
  SAMPLE_POSTS_COUNT: 3, // Number of posts to send as samples for system prompt generation
} as const;

// Status Enums
export const STATUS_VALUES = {
  POST_STATUS: {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
  },
  IMAGE_GENERATION_STATUS: {
    NONE: 'none',
    PENDING: 'pending',
    GENERATING: 'generating',
    COMPLETE: 'complete',
    FAILED: 'failed',
  },
  AGENT_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    DEPRECATED: 'deprecated',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  OPENAI: {
    CHAT_COMPLETIONS: 'https://api.openai.com/v1/chat/completions',
    IMAGE_GENERATIONS: 'https://api.openai.com/v1/images/generations',
  },
} as const;

// Edge Function Names
export const EDGE_FUNCTIONS = {
  CREATE_THEME_SYSTEM_PROMPT: 'create-theme-system-prompt',
  
  USER_IDEA_STREAMING_IMAGE_PIPELINE: 'user-idea-streaming-image-pipeline',
  GENERATE_COMPARISON_PAGES: 'generate-comparison-pages',
  GENERATE_CONTENT: 'generate-content',
  
  GENERATE_BLOG_CONTENT: 'generate-blog-content',
  GENERATE_CUSTOM_THEME: 'generate-custom-theme',
  GENERATE_HERO_JOB_VISUAL: 'generate-hero-job-visual',
  GENERATE_IMAGE_GPT: 'generate-image-gpt',
  GENERATE_VOICEOVER_SCRIPT: 'generate-voiceover-script',
  PROCESS_AND_IMPORT_THEME: 'process-and-import-theme',
  PROCESS_FUNDING_JSON: 'process-funding-json',
  PROCESS_INVESTOR_JSON: 'process-investor-json',
  PROCESS_THEME_JSON: 'process-theme-json',
  PROCESS_UPLOADED_IMAGES: 'process-uploaded-images',
  COVER_LETTER_AGENT: 'cover-letter-agent',
  STREAMING_IMAGE_PIPELINE: 'streaming-image-pipeline',
} as const;

// Content Configuration
export const CONTENT_CONFIG = {
  THEME: {
    MAX_LENGTH: 200,
    MIN_LENGTH: 10,
  },
  TITLE: {
    MAX_LENGTH: 500,
    MIN_LENGTH: 10,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
    MIN_LENGTH: 50,
    OPTIMAL_LENGTH: 200,
    SUBSTRING_PREVIEW: 50, // Characters to show in logs
  },
  PROMPT: {
    PREVIEW_LENGTH: 200,
    MAX_LENGTH: 4000,
  },
  POSTS: {
    DEFAULT_COUNT: 10,
    SAMPLE_COUNT: 3,
    DAY_RANGE: { MIN: 1, MAX: 10 },
  },
} as const;

// HTTP Configuration
export const HTTP_CONFIG = {
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    OPENAI_API: 60000, // 60 seconds for AI generation
    DATABASE: 10000, // 10 seconds for DB operations
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  MISSING_REQUIRED_PARAMS: 'Missing required parameters',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
  DATABASE_ERROR: 'Database operation failed',
  THEME_GENERATION_FAILED: 'Theme generation failed',
  IMAGE_GENERATION_FAILED: 'Image generation failed',
  NO_POSTS_FOUND: 'No posts found for theme',
  NETWORK_ERROR: 'Network error',
} as const;

// Supabase Client Versions (to standardize)
export const SUPABASE_CONFIG = {
  CLIENT_VERSION: '@supabase/supabase-js@2.50.4',
  DENO_STD_VERSION: 'https://deno.land/std@0.168.0',
  XHR_VERSION: 'https://deno.land/x/xhr@0.1.0',
} as const;