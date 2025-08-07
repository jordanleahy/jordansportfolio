// GPT-image-1 API pricing constants (USD)
const PRICING = {
  'gpt-image-1': {
    base_cost: 0.052, // $0.052 per image regardless of size/quality
  },
} as const;

export const calculateGptImageGenerationCost = (): number => {
  // GPT-image-1 has a flat rate regardless of size or quality
  return PRICING['gpt-image-1'].base_cost;
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
    'gpt-image-1': 'GPT Image Generator',
  };
  return modelNames[model as keyof typeof modelNames] || model;
};

export const getFunctionDisplayName = (functionName: string): string => {
  const functionNames = {
    'generate-image-gpt': 'GPT Image Generation',
  };
  return functionNames[functionName as keyof typeof functionNames] || functionName;
};