// Agent Names - centralized for consistency
export const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator', 
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
  CALENDAR_THEME_JSON_PROCESSOR: 'Calendar Theme JSON Processor',
  STORY_TELLING_AGENT: 'Story Telling Agent',
} as const;

// System Prompt Categories
export const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
  HEALTHCARE: 'healthcare',
  CONTRACTS: 'contracts',
  DESIGN: 'design',
  PRODUCT_MANAGER: 'product_manager',
  PRODUCT_DESIGNER: 'product_designer',
  CHILDRENS_STORY: 'childrens_story',
  CONVINCING_STORY: 'convincing_story',
} as const;

// OpenAI Model Versions (Latest - gpt-5 models launched Aug 7, 2025)
export const OPENAI_MODELS = {
  // Latest flagship model (launched Aug 7, 2025)
  FLAGSHIP: 'gpt-5-mini',
  // Reasoning models
  REASONING: 'o3-2025-04-16',
  // Vision model (gpt-5-mini has vision capabilities)
  VISION: 'gpt-5-mini',
  // Legacy models (deprecated)
  LEGACY_GPT4O: 'gpt-4o',
  LEGACY_GPT4O_MINI: 'gpt-4o-mini',
} as const;

// Default Model Versions (Updated to latest)
export const DEFAULT_MODELS = {
  FAST: OPENAI_MODELS.FLAGSHIP,
  POWERFUL: OPENAI_MODELS.FLAGSHIP,
  REASONING: OPENAI_MODELS.REASONING,
  VISION: OPENAI_MODELS.FLAGSHIP,
} as const;

// Model Options with Descriptions
export const MODEL_OPTIONS = [
  {
    value: OPENAI_MODELS.FLAGSHIP,
    label: 'gpt-5-mini (Flagship)',
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
    value: OPENAI_MODELS.VISION,
    label: 'gpt-5-mini (Vision)',
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
  DETERMINISTIC: 1,  // For consistent outputs
  FOCUSED: 1,        // For system prompts and structured content
  LOW_CREATIVE: 1,   // For blog content generation
  BALANCED: 1,       // For creative but controlled content
  HIGH_CREATIVE: 1,  // For visual prompts and hero content
  CREATIVE: 1,       // For highly creative content
} as const;

// Max Token Settings for Different Use Cases
export const MAX_TOKENS = {
  SHORT_RESPONSE: 500,      // For image prompts
  MEDIUM_RESPONSE: 2000,    // For cover letters, scripts
  LONG_RESPONSE: 2500,      // For comparison pages
  COMPREHENSIVE: 4000,      // For blog content, system prompts
} as const;