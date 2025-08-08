/**
 * DEVELOPER NOTES - Centralized Formatting Helpers
 * 
 * Common formatting utilities used across usage and subscription components
 * - Number formatting with locale support
 * - Credit display formatting 
 * - Percentage calculations and display
 * - Currency formatting for costs
 */

/**
 * Format numbers with proper locale formatting and thousand separators
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

/**
 * Format credit counts for display (e.g., "1,234 / 10,000")
 */
export const formatCredits = (used: number, total: number): string => {
  return `${formatNumber(used)} / ${formatNumber(total)}`;
};

/**
 * Calculate and format percentage with single decimal place
 */
export const formatPercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((used / total) * 100 * 10) / 10;
};

/**
 * Format currency amounts for cost display
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

/**
 * Get appropriate color class for usage percentage
 */
export const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-destructive';
  if (percentage >= 75) return 'text-warning';
  return 'text-primary';
};

/**
 * Get appropriate progress bar color for usage percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-destructive';
  if (percentage >= 75) return 'bg-warning';
  return 'bg-primary';
};