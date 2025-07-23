export const SEO_DEFAULTS = {
  siteUrl: 'https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com',
  siteName: 'Jordan\'s Portfolio',
  defaultTitle: 'Jordan\'s Portfolio - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leigh.',
  defaultImage: '/og-images/default-hero.png',
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

export const generateSEOMetadata = (metadata: SEOMetadata = {}) => {
  const {
    title = SEO_DEFAULTS.defaultTitle,
    description = SEO_DEFAULTS.defaultDescription,
    image = SEO_DEFAULTS.defaultImage,
    url,
    type = 'website',
    noIndex = false
  } = metadata;

  const fullTitle = title === SEO_DEFAULTS.defaultTitle ? title : `${title} | ${SEO_DEFAULTS.siteName}`;
  const fullImageUrl = image.startsWith('http') ? image : `${SEO_DEFAULTS.siteUrl}${image}`;
  const fullUrl = url ? `${SEO_DEFAULTS.siteUrl}${url}` : SEO_DEFAULTS.siteUrl;

  return {
    title: fullTitle,
    description,
    image: fullImageUrl,
    url: fullUrl,
    type,
    noIndex,
    siteName: SEO_DEFAULTS.siteName,
  };
};