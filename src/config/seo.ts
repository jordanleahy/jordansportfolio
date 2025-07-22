
export const SEO_CONFIG = {
  // Production domain - consistent across all SEO metadata
  baseUrl: 'https://www.jordanleahy.com',
  
  // Default metadata
  siteName: 'Jordan Leigh Portfolio',
  author: 'Jordan Leigh',
  twitterHandle: '@jordanleahy',
  
  // Default images
  defaultOgImage: '/placeholder.svg',
  logoUrl: '/logo.png',
  
  // Reading speed for calculating read time
  wordsPerMinute: 200,
} as const;

// Helper to construct full URLs
export const getFullUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${SEO_CONFIG.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Helper to get the best OG image with fallback logic
export const getOgImageUrl = (
  ogImage?: string,
  heroImage16_9?: string,
  heroImage?: string
): string => {
  const imageUrl = ogImage || heroImage16_9 || heroImage;
  return imageUrl ? getFullUrl(imageUrl) : getFullUrl(SEO_CONFIG.defaultOgImage);
};

// Helper to clean URLs from preview parameters
export const getCleanUrl = (url: string): string => {
  return url.split('?')[0].split('#')[0];
};
