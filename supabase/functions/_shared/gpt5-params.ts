// GPT-5+ Parameter Builder Utility
// Automatically handles parameter differences between GPT-5+ and legacy models

export const buildGPT5Params = (baseParams: any) => {
  // Destructure to separate supported from unsupported params
  const { temperature, max_tokens, max_completion_tokens, ...supportedParams } = baseParams;
  
  return {
    ...supportedParams,
    // Use max_completion_tokens for GPT-5+ (required parameter)
    max_completion_tokens: max_tokens || max_completion_tokens || 7000,
  };
};

// GPT-5+ Model constants
export const GPT5_MODELS = {
  FLAGSHIP: 'gpt-5-2025-08-07',
  MINI: 'gpt-5-mini-2025-08-07', 
  NANO: 'gpt-5-nano-2025-08-07',
  // Reasoning models
  O3: 'o3-2025-04-16',
  O4_MINI: 'o4-mini-2025-04-16'
} as const;

// Default models for different use cases
export const DEFAULT_GPT5_MODELS = {
  CONTENT_GENERATION: GPT5_MODELS.FLAGSHIP,
  FAST_RESPONSES: GPT5_MODELS.MINI,
  SIMPLE_TASKS: GPT5_MODELS.NANO,
  COMPLEX_REASONING: GPT5_MODELS.O3,
  FAST_REASONING: GPT5_MODELS.O4_MINI
} as const;