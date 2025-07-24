// Shared SEO/OG utilities for both Edge Functions and React components
// This file contains environment-agnostic utilities for consistent SEO metadata generation

export const SEO_CONSTANTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leahy',
  defaultTitle: 'Jordan Leahy - AI Revenue Cycle Healthcare Product Designer',
  defaultDescription: 'Explore AI technology solutions, competitive intelligence, and product development insights from Jordan Leahy.',
  defaultImage: 'https://jordanleahy.com/og-default.png',
  blogTemplateImage: 'https://jordanleahy.com/og-blog-template.png',
  twitterHandle: '@jordanleigh',
} as const;

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

export interface SEOMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'article';
  publishedDate?: string;
  author?: string;
}

/**
 * Escapes HTML entities to prevent XSS attacks
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Cleans and normalizes image URLs to ensure they're absolute
 */
export const cleanImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  // If it's a relative URL, prepend the site domain
  if (url.startsWith('/')) {
    return `${SEO_CONSTANTS.siteUrl}${url}`;
  }
  
  // If it's absolute, remove double slashes (except after protocol)
  return url.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * Truncates text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
};

/**
 * Optimizes title for Open Graph (60-90 characters)
 */
export const optimizeOGTitle = (title: string): string => {
  return truncateText(title, 88);
};

/**
 * Optimizes description for Open Graph (155-300 characters, 130-160 displays fully)
 */
export const optimizeOGDescription = (description: string): string => {
  return truncateText(description, 155);
};

/**
 * Detects if the user agent is from a social media crawler
 */
export const isSocialMediaCrawler = (userAgent: string): boolean => {
  return /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|googlebot|bingbot|slackbot|discordbot/i.test(userAgent);
};

/**
 * Generates SEO metadata from a blog post
 */
export const generateBlogSEOMetadata = (post: BlogPost): SEOMetadata => {
  const postUrl = `${SEO_CONSTANTS.siteUrl}/blog/${post.slug}`;
  
  // Title priority: meta_title > hero_headline > default
  const title = post.meta_title || post.hero_headline || SEO_CONSTANTS.defaultTitle;
  
  // Description priority: meta_description > intro_content > default
  const description = post.meta_description || post.intro_content || SEO_CONSTANTS.defaultDescription;
  
  // Image priority: og_image_url (if not default) > hero_image_url > blog template > default
  const ogImage = cleanImageUrl(post.og_image_url);
  const heroImage = cleanImageUrl(post.hero_image_url);
  const image = (ogImage && !ogImage.includes('og-blog-template.png') ? ogImage : null) ||
               heroImage ||
               SEO_CONSTANTS.blogTemplateImage;
  
  // Published date from published_at or created_at
  const publishedDate = (post.published_at || post.created_at) ? 
    new Date(post.published_at || post.created_at).toISOString() : 
    undefined;

  return {
    title: optimizeOGTitle(title),
    description: optimizeOGDescription(description),
    image: image || SEO_CONSTANTS.defaultImage,
    url: postUrl,
    type: 'article',
    publishedDate,
    author: 'Jordan Leahy'
  };
};

/**
 * Generates default SEO metadata for not found or error cases
 */
export const generateDefaultSEOMetadata = (path?: string): SEOMetadata => {
  return {
    title: SEO_CONSTANTS.defaultTitle,
    description: SEO_CONSTANTS.defaultDescription,
    image: SEO_CONSTANTS.defaultImage,
    url: path ? `${SEO_CONSTANTS.siteUrl}${path}` : SEO_CONSTANTS.siteUrl,
    type: 'website'
  };
};

/**
 * Generates complete HTML with OG tags for crawlers
 */
export const generateCrawlerHTML = (metadata: SEOMetadata, bodyContent?: string): string => {
  const defaultBodyContent = `
    <article>
        <h1>${escapeHtml(metadata.title)}</h1>
        <p>${escapeHtml(metadata.description)}</p>
        ${metadata.publishedDate ? `<p>Published: ${new Date(metadata.publishedDate).toLocaleDateString()}</p>` : ''}
        <p><a href="${metadata.url}">Read the full article on jordanleahy.com</a></p>
    </article>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="description" content="${escapeHtml(metadata.description)}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(metadata.title)}">
    <meta property="og:description" content="${escapeHtml(metadata.description)}">
    <meta property="og:image" content="${metadata.image}">
    <meta property="og:url" content="${metadata.url}">
    <meta property="og:type" content="${metadata.type}">
    <meta property="og:site_name" content="${SEO_CONSTANTS.siteName}">
    ${metadata.publishedDate ? `<meta property="article:published_time" content="${metadata.publishedDate}">` : ''}
    ${metadata.author ? `<meta property="article:author" content="${metadata.author}">` : ''}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}">
    <meta name="twitter:description" content="${escapeHtml(metadata.description)}">
    <meta name="twitter:image" content="${metadata.image}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${metadata.url}">
</head>
<body>
    ${bodyContent || defaultBodyContent}
</body>
</html>`;
};

/**
 * Generates HTML for error cases
 */
export const generateErrorHTML = (slug?: string): string => {
  const metadata = generateDefaultSEOMetadata(slug ? `/blog/${slug}` : '/blog');
  const errorBodyContent = `
    <h1>Blog Post Not Found</h1>
    <p>The requested blog post could not be found.</p>
  `;
  
  return generateCrawlerHTML(metadata, errorBodyContent);
};

/**
 * Generates HTML for server errors
 */
export const generateServerErrorHTML = (): string => {
  const metadata = generateDefaultSEOMetadata();
  const errorBodyContent = `
    <h1>Error</h1>
    <p>An error occurred while loading the blog post.</p>
  `;
  
  return generateCrawlerHTML(metadata, errorBodyContent);
};