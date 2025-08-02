// Edge Function Names
export const EDGE_FUNCTION_NAMES = {
  INVOKE_SYSTEM_PROMPT_AGENT: 'invoke-system-prompt-agent',
  GENERATE_COMPARISON_PAGES: 'generate-comparison-pages',
  GENERATE_CONTENT: 'generate-content',
  GENERATE_IMAGE_PROMPT_DYNAMIC: 'generate-image-prompt-dynamic',
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
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'Required agent not found for this user',
  SYSTEM_PROMPT_NOT_FOUND: 'No system prompt found for specified category',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
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