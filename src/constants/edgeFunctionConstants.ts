// Edge Function Names
export const EDGE_FUNCTION_NAMES = {
  CREATE_THEME_SYSTEM_PROMPT: 'create-theme-system-prompt',
  GENERATE_COMPARISON_PAGES: 'generate-comparison-pages',
  GENERATE_CONTENT: 'generate-content',
  CREATE_SINGLE_IMAGE_PROMPT: 'create-single-image-prompt',
  GENERATE_BLOG_CONTENT: 'generate-blog-content',
  
  GENERATE_HERO_JOB_VISUAL: 'generate-hero-job-visual',
  GENERATE_IMAGE: 'generate-image',
  GENERATE_VOICEOVER_SCRIPT: 'generate-voiceover-script',
  PROCESS_AND_IMPORT_THEME: 'process-and-import-theme',
  PROCESS_FUNDING_JSON: 'process-funding-json',
  PROCESS_INVESTOR_JSON: 'process-investor-json',
  PROCESS_THEME_JSON: 'process-theme-json',
  PROCESS_UPLOADED_IMAGES: 'process-uploaded-images',
  COVER_LETTER_AGENT: 'cover-letter-agent',
  STREAMING_IMAGE_PIPELINE: 'streaming-image-pipeline',
  USER_IDEA_STREAMING_IMAGE_PIPELINE: 'user-idea-streaming-image-pipeline',
  STREET_VISION_AGENT: 'street-vision-agent',
  
} as const;

// OpenAI API Configuration
export const OPENAI_CONFIG = {
  MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 1,
  DEFAULT_MODEL: 'gpt-5-mini', // Updated to latest flagship model
  TIMEOUT_MS: 180000, // Base timeout for edge functions
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 3,
    RECOVERY_TIMEOUT: 30000, // 30 seconds before retry
    MONITOR_WINDOW: 300000,  // 5 minutes monitoring window
  },
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
  OPENAI_MODERATION_BLOCKED: 'OpenAI flagged this request as potentially unsafe. Please try a different prompt that doesn\'t include sensitive content.',
  OPENAI_CONTENT_VIOLATION: 'The request was rejected due to content policy violations. Please modify your prompt and try again.',
  OPENAI_SAFETY_SYSTEM_ERROR: 'Content was flagged by safety systems. Please use different wording in your request.',
} as const;

// CORS Headers
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

// Database Settings
export const DB_SETTINGS = {
  HTTP_TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 2,
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