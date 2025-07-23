
export const SEO_DEFAULTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leigh',
  defaultTitle: 'Jordan Leigh - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leigh.',
  defaultImage: 'https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images/screencapture-jordanleahy-2025-07-16-10_54_07-edit.png',
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
