
export const SEO_DEFAULTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leahy',
  defaultTitle: 'Jordan Leahy - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leahy.',
  // Use the absolute URL for the default OG image to ensure it works properly
  // with social media crawlers
  defaultImage: 'https://jordanleahy.com/lovable-uploads/a3482ced-732a-40a0-95b4-3199495f0f4f.png',
  blogTemplateImage: 'https://jordanleahy.com/og-blog-template.png',
  twitterHandle: '@jordanleigh',
} as const;

export interface SEOMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  publishedDate?: string;
  author?: string;
}

export interface BlogPost {
  slug: string;
  meta_title?: string;
  meta_description?: string;
  hero_headline?: string;
  intro_content?: string;
  og_image_url?: string;
  hero_image_url?: string;
  published_at?: string;
  created_at?: string;
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

/**
 * Cleans and normalizes image URLs to ensure they're absolute
 * Matches the logic used in the Edge Function for consistency
 */
export const cleanImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // If it's a relative URL, prepend the site domain
  if (url.startsWith('/')) {
    return `${SEO_DEFAULTS.siteUrl}${url}`;
  }
  
  // If it's absolute, remove double slashes (except after protocol)
  return url.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * Generates SEO metadata from a blog post
 * Matches the logic used in the Edge Function for consistency
 */
export const generateBlogSEOMetadata = (post: BlogPost): SEOMetadata => {
  const postUrl = `${SEO_DEFAULTS.siteUrl}/blog/${post.slug}`;
  
  // Title priority: meta_title > hero_headline > default
  const title = post.meta_title || post.hero_headline || SEO_DEFAULTS.defaultTitle;
  
  // Description priority: meta_description > intro_content > default
  const description = post.meta_description || post.intro_content || SEO_DEFAULTS.defaultDescription;
  
  // Image priority: og_image_url (if not default) > hero_image_url > blog template > default
  const ogImage = cleanImageUrl(post.og_image_url);
  const heroImage = cleanImageUrl(post.hero_image_url);
  const image = (ogImage && !ogImage.includes('og-blog-template.png') ? ogImage : null) ||
               heroImage ||
               SEO_DEFAULTS.blogTemplateImage;
  
  // Published date from published_at or created_at
  const publishedDate = (post.published_at || post.created_at) ? 
    new Date(post.published_at || post.created_at).toISOString() : 
    undefined;

  return {
    title: optimizeOGTitle(title),
    description: optimizeOGDescription(description),
    image: image || SEO_DEFAULTS.defaultImage,
    url: postUrl,
    type: 'article',
    publishedDate,
    author: 'Jordan Leahy'
  };
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
