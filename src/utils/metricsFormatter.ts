
export interface FormattedMetric {
  label: string;
  value: string;
  type: 'financial' | 'percentage' | 'count' | 'volume' | 'text';
  icon: string;
  color: string;
}

export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return value.toString();
  
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
};

export const formatPercentage = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
  return `${num}%`;
};

export const detectMetricType = (key: string, value: any): FormattedMetric['type'] => {
  const keyLower = key.toLowerCase();
  
  // Financial indicators
  if (keyLower.includes('usd') || keyLower.includes('cash') || keyLower.includes('benefit') || 
      keyLower.includes('revenue') || keyLower.includes('funding') || keyLower.includes('cost') ||
      keyLower.includes('savings') || keyLower.includes('payment')) {
    return 'financial';
  }
  
  // Percentage indicators
  if (keyLower.includes('percentage') || keyLower.includes('rate') || keyLower.includes('percent') ||
      (typeof value === 'string' && value.toString().includes('%'))) {
    return 'percentage';
  }
  
  // Volume indicators (large numbers)
  if (keyLower.includes('charts') || keyLower.includes('claims') || keyLower.includes('transactions') ||
      keyLower.includes('processed') || keyLower.includes('volume')) {
    return 'volume';
  }
  
  // Count indicators
  if (keyLower.includes('count') || keyLower.includes('number') || keyLower.includes('sites') ||
      keyLower.includes('employees') || keyLower.includes('users')) {
    return 'count';
  }
  
  return 'text';
};

export const getMetricIcon = (type: FormattedMetric['type']): string => {
  switch (type) {
    case 'financial': return 'DollarSign';
    case 'percentage': return 'TrendingUp';
    case 'volume': return 'BarChart3';
    case 'count': return 'Users';
    default: return 'Activity';
  }
};

export const getMetricColor = (type: FormattedMetric['type']): string => {
  switch (type) {
    case 'financial': return 'text-green-600';
    case 'percentage': return 'text-blue-600';
    case 'volume': return 'text-purple-600';
    case 'count': return 'text-orange-600';
    default: return 'text-gray-600';
  }
};

export const formatMetricLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatMetricValue = (key: string, value: any, type: FormattedMetric['type']): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const stringValue = value.toString();
  
  switch (type) {
    case 'financial':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'volume':
    case 'count':
      const num = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? stringValue : formatLargeNumber(num);
    default:
      return stringValue;
  }
};

export const parsePerformanceMetrics = (metrics: any): FormattedMetric[] => {
  if (!metrics || typeof metrics !== 'object') return [];
  
  return Object.entries(metrics).map(([key, value]) => {
    const type = detectMetricType(key, value);
    const label = formatMetricLabel(key);
    const formattedValue = formatMetricValue(key, value, type);
    const icon = getMetricIcon(type);
    const color = getMetricColor(type);
    
    return {
      label,
      value: formattedValue,
      type,
      icon,
      color
    };
  });
};
