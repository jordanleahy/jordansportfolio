import type { BlogPost } from '../types/blog';

// Re-export the shared utilities pattern for consistency
export const SEO_CONSTANTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leigh',
  defaultTitle: 'Jordan Leigh - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leigh.',
  // Use absolute URL for default OG image to ensure compatibility with crawlers
  defaultImage: 'https://jordanleahy.com/og-default.png',
  twitterHandle: '@jordanleigh'
};

// Minimal blog post interface for OG generation
export interface BlogPostForOG {
  slug: string;
  meta_title?: string;
  meta_description?: string;
  hero_headline?: string;
  hero_subhead?: string;
  og_image_url?: string;
  hero_image_url?: string;
  hero_image_16_9_url?: string;
  published_at?: string;
  intro_content?: string;
}

export interface StaticOGOptions {
  outputDir?: string;
  includeBodyContent?: boolean;
  customSiteUrl?: string;
}

export interface StaticFileResult {
  slug: string;
  path: string;
  title: string;
  success: boolean;
  error?: string;
}

function cleanImageUrl(url: string | null): string {
  if (!url) return SEO_CONSTANTS.defaultImage;
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? `${SEO_CONSTANTS.siteUrl}${url}` : `${SEO_CONSTANTS.siteUrl}/${url}`;
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function optimizeOGTitle(title: string): string {
  return truncateText(title, 60);
}

function optimizeOGDescription(description: string): string {
  return truncateText(description, 155);
}

function generateBlogSEOMetadata(post: BlogPostForOG) {
  const title = post.meta_title || post.hero_headline || SEO_CONSTANTS.defaultTitle;
  const description = post.meta_description || post.hero_subhead || SEO_CONSTANTS.defaultDescription;
  const image = post.og_image_url || post.hero_image_url || post.hero_image_16_9_url || SEO_CONSTANTS.defaultImage;
  
  return {
    title: optimizeOGTitle(title),
    description: optimizeOGDescription(description),
    image: cleanImageUrl(image),
    url: `${SEO_CONSTANTS.siteUrl}/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.published_at,
    author: 'Jordan Leigh',
    siteName: SEO_CONSTANTS.siteName,
    twitterHandle: SEO_CONSTANTS.twitterHandle
  };
}

function generateCrawlerHTML(metadata: any, bodyContent = ''): string {
  const escapeHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const escapedTitle = escapeHtml(metadata.title);
  const escapedDescription = escapeHtml(metadata.description);
  const escapedUrl = escapeHtml(metadata.url);
  const escapedImage = escapeHtml(metadata.image);
  const escapedSiteName = escapeHtml(metadata.siteName);
  const escapedAuthor = escapeHtml(metadata.author);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${metadata.type || 'article'}">
  <meta property="og:url" content="${escapedUrl}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${escapedImage}">
  <meta property="og:site_name" content="${escapedSiteName}">
  <meta property="og:locale" content="en_US">
  ${metadata.publishedTime ? `<meta property="article:published_time" content="${metadata.publishedTime}">` : ''}
  ${metadata.author ? `<meta property="article:author" content="${escapedAuthor}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapedUrl}">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${escapedImage}">
  ${metadata.twitterHandle ? `<meta name="twitter:site" content="${metadata.twitterHandle}">` : ''}
  
  <!-- LinkedIn -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${escapedUrl}">
  <meta name="robots" content="index, follow">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${escapedTitle}",
    "description": "${escapedDescription}",
    "image": "${escapedImage}",
    "url": "${escapedUrl}",
    "datePublished": "${metadata.publishedTime || new Date().toISOString()}",
    "author": {
      "@type": "Organization",
      "name": "${escapedAuthor || 'Jordan Leigh'}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${escapedSiteName}",
      "logo": {
        "@type": "ImageObject",
        "url": "${SEO_CONSTANTS.siteUrl}/logo.png"
      }
    }
  }
  </script>
  
  <!-- Client-side redirect for non-crawlers -->
  <script>
    (function() {
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent);
      const isHeadless = /headless|phantom|selenium|webdriver/i.test(userAgent);
      
      if (!isCrawler && !isHeadless) {
        setTimeout(function() {
          window.location.replace('${escapedUrl}');
        }, 100);
      }
    })();
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #fafafa;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #1a1a1a;
      line-height: 1.2;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .description {
      font-size: 1.25rem;
      color: #555;
      margin-bottom: 2rem;
    }
    .image {
      width: 100%;
      max-width: 600px;
      height: auto;
      margin: 2rem 0;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .cta {
      margin-top: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }
    .cta a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      h1 { font-size: 2rem; }
      .description { font-size: 1.1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <article>
      <h1>${escapedTitle}</h1>
      ${metadata.publishedTime ? `
        <div class="meta">
          Published on ${new Date(metadata.publishedTime).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      ` : ''}
      <div class="description">${escapedDescription}</div>
      ${metadata.image && metadata.image !== SEO_CONSTANTS.defaultImage ? `
        <img src="${escapedImage}" alt="${escapedTitle}" class="image">
      ` : ''}
      ${bodyContent ? `<div class="content">${bodyContent}</div>` : ''}
      <div class="cta">
        <p><strong>Read the full article:</strong> <a href="${escapedUrl}">Continue reading on ${escapedSiteName} →</a></p>
      </div>
    </article>
  </div>
</body>
</html>`;
}

/**
 * Generate static OG HTML template for a blog post
 */
export function generateStaticOGTemplate(
  post: BlogPostForOG, 
  options: StaticOGOptions = {}
): string {
  const { includeBodyContent = false } = options;
  
  const metadata = generateBlogSEOMetadata(post);
  
  let bodyContent = '';
  if (includeBodyContent && post.intro_content) {
    const plainText = post.intro_content
      .replace(/<[^>]*>/g, '')
      .substring(0, 300) + '...';
    
    bodyContent = `<div class="intro-preview">${plainText}</div>`;
  }
  
  return generateCrawlerHTML(metadata, bodyContent);
}

/**
 * Generate file path for static OG file
 */
export function generateOGFilePath(slug: string, outputDir = 'public/blog'): string {
  return `${outputDir}/${slug}.html`;
}

/**
 * Validate blog post data for OG generation
 */
export function validatePostForOG(post: Partial<BlogPost>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!post.slug) {
    errors.push('Post must have a slug');
  }
  
  if (!post.meta_title && !post.hero_headline) {
    errors.push('Post must have either meta_title or hero_headline');
  }
  
  if (!post.meta_description && !post.hero_subhead) {
    errors.push('Post must have either meta_description or hero_subhead');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get optimized metadata for social media sharing
 */
export function getOptimizedSocialMetadata(post: BlogPostForOG) {
  return generateBlogSEOMetadata(post);
}

/**
 * Check if crawler detection is working properly
 */
export function isSocialMediaCrawler(userAgent: string): boolean {
  return /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent);
}