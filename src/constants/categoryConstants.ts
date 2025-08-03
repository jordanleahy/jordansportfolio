// Known default categories - can be extended dynamically
export const DEFAULT_CATEGORIES = [
  'cdi',
  'contracts', 
  'coding ai',
  'ai agents',
  'product_manager',
  'product_designer'
] as const;

// Comprehensive Visual Prompt Generator categories
export const VISUAL_PROMPT_CATEGORIES = [
  // Healthcare & Medical
  'cdi',
  'contracts',
  'healthcare-coding',
  'medical-devices',
  'pharmaceuticals',
  'telemedicine',
  'hospital-operations',
  'patient-care',
  
  // Technology & AI
  'coding ai',
  'ai agents',
  'cybersecurity',
  'cloud-computing',
  'data-analytics',
  'machine-learning',
  'blockchain',
  'iot',
  
  // Product & Design
  'product_manager',
  'product_designer',
  'ux-research',
  'design-systems',
  'user-interface',
  'prototyping',
  'user-testing',
  
  // Business & Finance
  'business-strategy',
  'financial-planning',
  'market-research',
  'sales-enablement',
  'customer-success',
  'marketing-automation',
  'brand-management',
  'competitive-analysis',
  
  // Operations & Management
  'project-management',
  'process-optimization',
  'quality-assurance',
  'supply-chain',
  'human-resources',
  'training-development',
  'change-management',
  
  // Legal & Compliance
  'legal-tech',
  'regulatory-compliance',
  'data-privacy',
  'risk-management',
  'contract-management',
  'intellectual-property',
  
  // Education & Learning
  'educational-technology',
  'e-learning',
  'corporate-training',
  'skill-development',
  'knowledge-management'
] as const;

// Category type is now flexible string instead of enum
export type CategoryType = string;

// Default labels for known categories
export const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
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