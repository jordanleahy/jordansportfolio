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

// OpenAI Model Versions (Latest)
export const OPENAI_MODELS = {
  // Latest flagship model
  FLAGSHIP: 'gpt-4.1-2025-04-14',
  // Reasoning models
  REASONING: 'o3-2025-04-16', 
  REASONING_FAST: 'o4-mini-2025-04-16',
  // Vision model
  VISION: 'gpt-4.1-mini-2025-04-14',
  // Legacy models (deprecated)
  LEGACY_GPT4O: 'gpt-4o',
  LEGACY_GPT4O_MINI: 'gpt-4o-mini',
} as const;

// Default Model Versions (Updated to latest)
export const DEFAULT_MODELS = {
  FAST: OPENAI_MODELS.REASONING_FAST,
  POWERFUL: OPENAI_MODELS.FLAGSHIP,
  REASONING: OPENAI_MODELS.REASONING,
  VISION: OPENAI_MODELS.VISION,
} as const;

// Model Options with Descriptions
export const MODEL_OPTIONS = [
  {
    value: OPENAI_MODELS.FLAGSHIP,
    label: 'gpt-4.1-2025-04-14 (Flagship)',
    description: 'Most capable flagship model',
    recommended: true
  },
  {
    value: OPENAI_MODELS.REASONING,
    label: 'o3-2025-04-16 (Reasoning)',
    description: 'Powerful reasoning model for complex problems',
    recommended: false
  },
  {
    value: OPENAI_MODELS.REASONING_FAST,
    label: 'o4-mini-2025-04-16 (Fast Reasoning)',
    description: 'Fast reasoning optimized for coding and visual tasks',
    recommended: false
  },
  {
    value: OPENAI_MODELS.VISION,
    label: 'gpt-4.1-mini-2025-04-14 (Vision)',
    description: 'Model with vision capabilities',
    recommended: false
  }
] as const;

// Agent Status Values
export const AGENT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DEPRECATED: 'deprecated',
} as const;

// Post/Content Status Values (matching database values)
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled', 
  PUBLISHED: 'published',
} as const;

// Image Generation Status Values
export const IMAGE_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Temperature Settings for Different Use Cases
export const TEMPERATURE_SETTINGS = {
  DETERMINISTIC: 0.0,  // For consistent outputs
  FOCUSED: 0.1,        // For system prompts and structured content
  LOW_CREATIVE: 0.3,   // For blog content generation
  BALANCED: 0.7,       // For creative but controlled content
  HIGH_CREATIVE: 0.8,  // For visual prompts and hero content
  CREATIVE: 0.9,       // For highly creative content
} as const;

// Max Token Settings for Different Use Cases
export const MAX_TOKENS = {
  SHORT_RESPONSE: 500,      // For image prompts
  MEDIUM_RESPONSE: 2000,    // For cover letters, scripts
  LONG_RESPONSE: 2500,      // For comparison pages
  COMPREHENSIVE: 4000,      // For blog content, system prompts
} as const;