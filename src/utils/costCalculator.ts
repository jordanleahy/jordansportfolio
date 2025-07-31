// OpenAI API pricing constants (USD)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.000150 / 1000, // $0.000150 per 1K tokens
    output: 0.000600 / 1000, // $0.000600 per 1K tokens
  },
  'dall-e-3': {
    standard: {
      '1024x1024': 0.040,
      '1024x1792': 0.080,
      '1792x1024': 0.080,
    },
    hd: {
      '1024x1024': 0.080,
      '1024x1792': 0.120,
      '1792x1024': 0.120,
    },
  },
} as const;

export const calculateTextGenerationCost = (
  model: string,
  promptTokens: number,
  completionTokens: number
): number => {
  if (model === 'gpt-4o-mini') {
    const inputCost = promptTokens * PRICING['gpt-4o-mini'].input;
    const outputCost = completionTokens * PRICING['gpt-4o-mini'].output;
    return inputCost + outputCost;
  }
  return 0;
};

export const calculateImageGenerationCost = (
  size: string,
  quality: string = 'standard'
): number => {
  const qualityKey = quality === 'hd' ? 'hd' : 'standard';
  const pricing = PRICING['dall-e-3'][qualityKey];
  
  if (size in pricing) {
    return pricing[size as keyof typeof pricing];
  }
  
  // Default to 1024x1024 if size not found
  return pricing['1024x1024'];
};

export const formatCurrency = (amount: number): string => {
  if (amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toFixed(2)}`;
};

export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const getCostColorClass = (cost: number): string => {
  if (cost < 0.01) return 'text-green-600';
  if (cost < 0.1) return 'text-yellow-600';
  if (cost < 1.0) return 'text-orange-600';
  return 'text-red-600';
};

export const getModelDisplayName = (model: string): string => {
  const modelNames = {
    'gpt-4o-mini': 'GPT-4o Mini',
    'dall-e-3': 'DALL-E 3',
    'gpt-image-1': 'GPT Image',
  };
  return modelNames[model as keyof typeof modelNames] || model;
};

export const getFunctionDisplayName = (functionName: string): string => {
  const functionNames = {
    'generate-image-prompt-dynamic': 'Image Prompt Generation',
    'generate-image-gpt': 'Image Generation',
    'generate-blog-content': 'Blog Content',
    'generate-comparison-pages': 'Comparison Pages',
  };
  return functionNames[functionName as keyof typeof functionNames] || functionName;
};