// Agent Names - centralized for consistency
export const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator', 
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
  CALENDAR_THEME_JSON_PROCESSOR: 'Calendar Theme JSON Processor',
  STORY_TELLING_AGENT: 'Story Telling Agent',
  SOCIAL_MEDIA_AGENT: 'Social Media Agent',
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
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  TWITTER_X: 'twitter_x',
} as const;

// Social Media Platforms Configuration
export const SOCIAL_MEDIA_PLATFORMS = {
  LINKEDIN: {
    name: 'LinkedIn',
    category: 'linkedin',
    maxLength: 3000,
    tone: 'professional',
    features: ['business_insights', 'thought_leadership', 'industry_trends']
  },
  INSTAGRAM: {
    name: 'Instagram',
    category: 'instagram',
    maxLength: 2200,
    tone: 'casual',
    features: ['visual_storytelling', 'personal_connection', 'behind_scenes']
  },
  TWITTER_X: {
    name: 'X (Twitter)',
    category: 'twitter_x',
    maxLength: 280,
    tone: 'engaging',
    features: ['thread_format', 'viral_potential', 'conversation_starter']
  }
} as const;

// OpenAI Model Versions (Latest - GPT-5 models launched Aug 7, 2025)
export const OPENAI_MODELS = {
  // Latest flagship model (launched Aug 7, 2025)
  FLAGSHIP: 'gpt-5-2025-08-07',
  FAST: 'gpt-5-mini-2025-08-07',
  FASTEST: 'gpt-5-nano-2025-08-07',
  // Reasoning models (now using GPT-5 flagship)
  REASONING: 'gpt-5-2025-08-07',
  // Vision model (GPT-5 has vision capabilities)
  VISION: 'gpt-5-2025-08-07',
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
    label: 'gpt-5-2025-08-07 (Flagship)',
    description: 'Most capable flagship model with 128K output tokens',
    recommended: true
  },
  {
    value: OPENAI_MODELS.FAST,
    label: 'gpt-5-mini-2025-08-07 (Fast)',
    description: 'Balanced speed and quality for most tasks',
    recommended: false
  },
  {
    value: OPENAI_MODELS.FASTEST,
    label: 'gpt-5-nano-2025-08-07 (Fastest)',
    description: 'Speed-optimized for simple tasks',
    recommended: false
  },
  {
    value: OPENAI_MODELS.REASONING,
    label: 'gpt-5-2025-08-07 (Reasoning)',
    description: 'Complex analysis and reasoning tasks',
    recommended: false
  },
  {
    value: OPENAI_MODELS.VISION,
    label: 'gpt-5-2025-08-07 (Vision)',
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

// Max Output Token Settings for GPT-5 (Different Use Cases)
export const MAX_OUTPUT_TOKENS = {
  SHORT_RESPONSE: 1000,      // For image prompts
  MEDIUM_RESPONSE: 5000,     // For cover letters, scripts
  LONG_RESPONSE: 15000,      // For comparison pages
  COMPREHENSIVE: 7000,       // For blog content, system prompts (updated to 7000)
  MAXIMUM: 128000,           // GPT-5 maximum output tokens
} as const;