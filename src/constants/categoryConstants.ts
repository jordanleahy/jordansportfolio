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
  // Legacy categories
  'cdi': 'Clinical Documentation Improvement',
  'contracts': 'Contracts',
  'coding ai': 'Coding AI',
  'ai agents': 'AI Agents',
  'product_manager': 'Product Manager',
  'product_designer': 'Product Designer',
  
  // Medical & Healthcare
  'adult-autism-neurodevelopment': 'Adult Autism Neurodevelopment',
  'alzheimers-disease': "Alzheimer's Disease",
  'atrial-fibrillation': 'Atrial Fibrillation',
  'clinical-ai-competitors': 'Clinical AI Competitors',
  'healthcare-coding': 'Healthcare Coding',
  'medical-devices': 'Medical Devices',
  'pharmaceuticals': 'Pharmaceuticals',
  'telemedicine': 'Telemedicine',
  'hospital-operations': 'Hospital Operations',
  'patient-care': 'Patient Care',
  
  // AI & Technology
  'ai-agent-ux-patterns': 'AI Agent UX Patterns',
  'machine-learning': 'Machine Learning',
  'cybersecurity': 'Cybersecurity',
  'cloud-computing': 'Cloud Computing',
  'data-analytics': 'Data Analytics',
  'blockchain': 'Blockchain',
  'iot': 'Internet of Things (IoT)',
  
  // Business & Strategy
  'business-strategy': 'Business Strategy',
  'financial-planning': 'Financial Planning',
  'market-research': 'Market Research',
  'sales-enablement': 'Sales Enablement',
  'customer-success': 'Customer Success',
  'marketing-automation': 'Marketing Automation',
  'brand-management': 'Brand Management',
  'competitive-analysis': 'Competitive Analysis',
  
  // Design & UX
  'ux-research': 'UX Research',
  'design-systems': 'Design Systems',
  'user-interface': 'User Interface',
  'user-testing': 'User Testing',
  'prototyping': 'Prototyping',
  
  // Operations
  'project-management': 'Project Management',
  'process-optimization': 'Process Optimization',
  'quality-assurance': 'Quality Assurance',
  'supply-chain': 'Supply Chain',
  'human-resources': 'Human Resources',
  'training-development': 'Training & Development',
  'change-management': 'Change Management',
  
  // Legal & Compliance
  'legal-tech': 'Legal Technology',
  'regulatory-compliance': 'Regulatory Compliance',
  'data-privacy': 'Data Privacy',
  'risk-management': 'Risk Management',
  'contract-management': 'Contract Management',
  'intellectual-property': 'Intellectual Property',
  
  // Education & Learning
  'educational-technology': 'Educational Technology',
  'e-learning': 'E-Learning',
  'corporate-training': 'Corporate Training',
  'skill-development': 'Skill Development',
  'knowledge-management': 'Knowledge Management',
  
  // Specific Examples from UI
  'buoyancy-for-prescriptions': 'Buoyancy for Prescriptions',
  'ballet-3-year-olds': 'Ballet for 3-Year-Olds'
};

// Helper functions for category management
export const getCategoryLabel = (category: string): string => {
  // Check for explicit mapping first
  if (DEFAULT_CATEGORY_LABELS[category]) {
    return DEFAULT_CATEGORY_LABELS[category];
  }
  
  // Enhanced fallback transformation for unmapped categories
  return category
    .split(/[-_\s]+/) // Split on hyphens, underscores, or spaces
    .map(word => {
      const lower = word.toLowerCase();
      
      // Handle common acronyms and abbreviations
      if (lower === 'ai') return 'AI';
      if (lower === 'ux') return 'UX';
      if (lower === 'ui') return 'UI';
      if (lower === 'api') return 'API';
      if (lower === 'cdi') return 'CDI';
      if (lower === 'iot') return 'IoT';
      if (lower === 'crm') return 'CRM';
      if (lower === 'erp') return 'ERP';
      if (lower === 'saas') return 'SaaS';
      if (lower === 'b2b') return 'B2B';
      if (lower === 'b2c') return 'B2C';
      
      // Handle numbers at start of word (e.g., "3-year" -> "3-Year")
      if (/^\d/.test(word)) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      
      // Regular title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
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