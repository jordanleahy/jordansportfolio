// Agent Names - centralized for consistency
export const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator', 
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
  CALENDAR_THEME_JSON_PROCESSOR: 'Calendar Theme JSON Processor',
} as const;

// System Prompt Categories
export const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
  HEALTHCARE: 'healthcare',
  CONTRACTS: 'contracts',
  DESIGN: 'design',
  PRODUCT_MANAGER: 'product_manager',
  PRODUCT_DESIGNER: 'product_designer',
} as const;

// Default Model Versions
export const DEFAULT_MODELS = {
  FAST: 'gpt-4o-mini',
  POWERFUL: 'gpt-4o',
} as const;

// Agent Status Values
export const AGENT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DEPRECATED: 'deprecated',
} as const;

// Temperature Settings for Different Use Cases
export const TEMPERATURE_SETTINGS = {
  DETERMINISTIC: 0.0,  // For consistent outputs
  FOCUSED: 0.1,        // For system prompts and structured content
  BALANCED: 0.7,       // For creative but controlled content
  CREATIVE: 0.9,       // For highly creative content
} as const;