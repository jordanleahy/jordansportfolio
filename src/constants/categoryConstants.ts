// Known default categories - can be extended dynamically
export const DEFAULT_CATEGORIES = [
  'chart-type',
  'cdi',
  'contracts', 
  'coding ai',
  'ai agents',
  'product_manager',
  'product_designer'
] as const;

// Category type is now flexible string instead of enum
export type CategoryType = string;

// Default labels for known categories
export const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  'chart-type': 'Chart Type',
  'cdi': 'CDI',
  'contracts': 'Contracts',
  'coding ai': 'Coding AI',
  'ai agents': 'AI Agents',
  'product_manager': 'Product Manager',
  'product_designer': 'Product Designer'
};

// Helper functions for category management
export const getCategoryLabel = (category: string): string => {
  return DEFAULT_CATEGORY_LABELS[category] || category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const isKnownCategory = (category: string): boolean => {
  return DEFAULT_CATEGORIES.includes(category as any);
};

export const validateCategoryName = (category: string): { valid: boolean; error?: string } => {
  if (!category || category.trim().length === 0) {
    return { valid: false, error: 'Category name is required' };
  }
  
  if (category.length > 100) {
    return { valid: false, error: 'Category name must be 100 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(category)) {
    return { valid: false, error: 'Category name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { valid: true };
};