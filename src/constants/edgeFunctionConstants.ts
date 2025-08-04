// Edge Function Names
export const EDGE_FUNCTION_NAMES = {
  INVOKE_SYSTEM_PROMPT_AGENT: 'invoke-system-prompt-agent',
  GENERATE_COMPARISON_PAGES: 'generate-comparison-pages',
  GENERATE_CONTENT: 'generate-content',
  GENERATE_IMAGE_PROMPT_DYNAMIC: 'generate-image-prompt-dynamic',
  GENERATE_BLOG_CONTENT: 'generate-blog-content',
  GENERATE_CUSTOM_THEME: 'generate-custom-theme',
  GENERATE_HERO_JOB_VISUAL: 'generate-hero-job-visual',
  GENERATE_IMAGE_GPT: 'generate-image-gpt',
  GENERATE_VOICEOVER_SCRIPT: 'generate-voiceover-script',
  GENERIC_BLOG: 'generic-blog',
  PROCESS_AND_IMPORT_THEME: 'process-and-import-theme',
  PROCESS_FUNDING_JSON: 'process-funding-json',
  PROCESS_INVESTOR_JSON: 'process-investor-json',
  PROCESS_THEME_JSON: 'process-theme-json',
  PROCESS_UPLOADED_IMAGES: 'process-uploaded-images',
  COVER_LETTER_AGENT: 'cover-letter-agent',
  STREAMING_IMAGE_PIPELINE: 'streaming-image-pipeline',
} as const;

// OpenAI API Configuration
export const OPENAI_CONFIG = {
  MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MODEL: 'o4-mini-2025-04-16', // Updated to latest fast reasoning model
  TIMEOUT_MS: 30000,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'Required agent not found for this user',
  SYSTEM_PROMPT_NOT_FOUND: 'No system prompt found for specified category',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  NETWORK_ERROR: 'Network error',
} as const;

// CORS Headers
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

// Database Settings
export const DB_SETTINGS = {
  HTTP_TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Content Length Limits
export const CONTENT_LIMITS = {
  THEME_MAX_LENGTH: 200,
  TITLE_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 2000,
  PROMPT_PREVIEW_LENGTH: 200,
  RESPONSE_PREVIEW_LENGTH: 500,
  MAX_POSTS_PER_HOUR: 200,
  MIN_CONTENT_LENGTH: 150,
  RECOMMENDED_CONTENT_LENGTH: 200,
} as const;

// Image Generation Settings
export const IMAGE_SETTINGS = {
  DEFAULT_SIZE: '1024x1024',
  DEFAULT_QUALITY: 'high',
  PROMPT_MAX_LENGTH: 1000,
} as const;