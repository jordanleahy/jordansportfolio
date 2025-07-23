
export const SEO_DEFAULTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leigh',
  defaultTitle: 'Jordan Leigh - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leigh.',
  // Use the absolute URL for the default OG image to ensure it works properly
  // with social media crawlers
  defaultImage: 'https://jordanleahy.com/og-default.png',
  twitterHandle: '@jordanleigh',
} as const;

export interface SEOMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

// Utility functions for OG optimization
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
};

const optimizeOGTitle = (title: string): string => {
  // OG titles should be 60-90 characters for optimal display
  return truncateText(title, 88);
};

const optimizeOGDescription = (description: string): string => {
  // OG descriptions should be 155-300 characters, but 130-160 displays fully
  return truncateText(description, 155);
};

export const generateSEOMetadata = (metadata: SEOMetadata = {}) => {
  const {
    title = SEO_DEFAULTS.defaultTitle,
    description = SEO_DEFAULTS.defaultDescription,
    image = SEO_DEFAULTS.defaultImage,
    url,
    type = 'website',
    noIndex = false
  } = metadata;

  // Page title (can be longer, used in browser tab)
  const pageTitle = title === SEO_DEFAULTS.defaultTitle ? title : `${title} | ${SEO_DEFAULTS.siteName}`;
  
  // Optimized OG title (shorter, no site name for articles to save space)
  const ogTitle = type === 'article' ? optimizeOGTitle(title) : optimizeOGTitle(pageTitle);
  
  // Optimized OG description
  const ogDescription = optimizeOGDescription(description);
  
  const fullImageUrl = image.startsWith('http') ? image : `${SEO_DEFAULTS.siteUrl}${image}`;
  const fullUrl = url ? `${SEO_DEFAULTS.siteUrl}${url}` : SEO_DEFAULTS.siteUrl;

  return {
    title: pageTitle,
    ogTitle,
    ogDescription,
    description,
    image: fullImageUrl,
    url: fullUrl,
    type,
    noIndex,
    siteName: SEO_DEFAULTS.siteName,
  };
};
