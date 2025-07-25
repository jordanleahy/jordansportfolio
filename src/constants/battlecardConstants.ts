/**
 * Configurable constants for battlecard system
 * This file centralizes all hardcoded values to make them easily configurable
 */

export const BATTLECARD_DEFAULTS = {
  // Fallback company names when data is missing
  COMPANY_FALLBACKS: {
    FIRST: 'First Company',
    SECOND: 'Second Company',
  },
  
  // Default value when data is missing
  MISSING_DATA_PLACEHOLDER: 'N/A',
  
  // Default battlecard categories - can be customized per industry
  BASIC_INFO_CATEGORIES: [
    'Founded',
    'Headquarters', 
    'Company Type',
    'Funding',
    'Investors',
    'Employee Size',
    'Delivery Model',
    'Target Customers',
    'Primary Solutions',
    'AI Core',
    'EHR Integration',
    'Notable Customers',
    'Partnerships',
    'Certifications',
    'Awards & Recognition'
  ] as const,
  
  // Feature battlecard defaults
  FEATURE_DEFAULTS: {
    EMPTY_FEATURE_PLACEHOLDER: 'Feature not specified',
    BOOLEAN_VALUES: {
      YES: 'Yes',
      NO: 'No',
      LIMITED: 'Limited',
      PARTIAL: 'Partial'
    }
  },
  
  // Use case defaults
  USE_CASE_DEFAULTS: {
    BEST_FIT_OPTIONS: ['Company 1', 'Company 2', 'Both', 'Neither'] as const,
    EMPTY_USE_CASE_PLACEHOLDER: 'Use case not specified'
  },
  
  // UI Text
  UI_TEXT: {
    NO_DATA_MESSAGE: 'No battlecard data available',
    LOADING_MESSAGE: 'Loading battlecard...',
    ERROR_MESSAGE: 'Failed to load battlecard data',
    NOT_FOUND_MESSAGE: 'The battlecard you\'re looking for doesn\'t exist.'
  }
} as const;

// Type exports for better type safety
export type BasicInfoCategory = typeof BATTLECARD_DEFAULTS.BASIC_INFO_CATEGORIES[number];
export type BestFitOption = typeof BATTLECARD_DEFAULTS.USE_CASE_DEFAULTS.BEST_FIT_OPTIONS[number];