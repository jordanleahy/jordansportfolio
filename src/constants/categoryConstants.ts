export const CATEGORY_TYPES = [
  'cdi',
  'contracts', 
  'forms',
  'coding ai',
  'ai agents'
] as const;

export type CategoryType = typeof CATEGORY_TYPES[number];

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  'cdi': 'CDI',
  'contracts': 'Contracts',
  'forms': 'Forms', 
  'coding ai': 'Coding AI',
  'ai agents': 'AI Agents'
};