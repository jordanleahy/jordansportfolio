#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Import shared SEO utilities
const seoUtilsPath = path.join(process.cwd(), 'supabase', 'functions', '_shared', 'seo-utils.ts');
let seoUtils;

try {
  // Dynamic import for the shared utilities
  // Note: In a real build environment, this would be transpiled
  const utilsContent = await fs.readFile(seoUtilsPath, 'utf8');
  // For now, we'll use the functions directly - in production this would be properly imported
} catch (error) {
  console.log('Using embedded SEO utilities...');
}

// Supabase configuration
const supabaseUrl = 'https://wgwmzfbnkovumqcvsxgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SEO utilities for OG generation
const SEO_CONSTANTS = {
  siteUrl: 'https://jordanleahy.com',
  siteName: 'Jordan Leigh',
  defaultTitle: 'Jordan Leigh - Healthcare Technology & Product Development',
  defaultDescription: 'Explore healthcare technology solutions, competitive intelligence, and product development insights from Jordan Leigh.',
  // Use absolute URL for default OG image to ensure compatibility with crawlers
  defaultImage: 'https://jordanleahy.com/og-default.png',
  twitterHandle: '@jordanleigh'
};

function cleanImageUrl(url) {
  if (!url) return SEO_CONSTANTS.defaultImage;
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? `${SEO_CONSTANTS.siteUrl}${url}` : `${SEO_CONSTANTS.siteUrl}/${url}`;
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function optimizeOGTitle(title) {
  return truncateText(title, 60);
}

function optimizeOGDescription(description) {
  return truncateText(description, 155);
}

function generateBlogSEOMetadata(post) {
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

// Enhanced HTML template generator using shared SEO utilities pattern
function generateCrawlerHTML(metadata, bodyContent = '') {
  const escapeHtml = (text) => {
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
  ${metadata.noIndex ? '<meta name="robots" content="noindex, nofollow">' : ''}
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
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
      
      // Also check for headless browsers
      const isHeadless = /headless|phantom|selenium|webdriver/i.test(userAgent);
      
      if (!isCrawler && !isHeadless) {
        // Add small delay to ensure crawlers can read meta tags
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
    .cta a:hover {
      text-decoration: underline;
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

async function fetchPublishedBlogPosts() {
  console.log('Fetching published blog posts from Supabase...');
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      slug,
      meta_title,
      meta_description,
      hero_headline,
      hero_subhead,
      og_image_url,
      hero_image_url,
      hero_image_16_9_url,
      published_at
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  console.log(`Found ${posts?.length || 0} published blog posts`);
  return posts || [];
}

async function generateStaticOGFiles(posts) {
  console.log('Generating static OG HTML files...');
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'public', 'blog');
  await fs.mkdir(outputDir, { recursive: true });

  const results = [];

  for (const post of posts) {
    try {
      // Generate SEO metadata
      const metadata = generateBlogSEOMetadata(post);
      
      // Generate HTML content
      const html = generateCrawlerHTML(metadata);
      
      // Write to file
      const filePath = path.join(outputDir, `${post.slug}.html`);
      await fs.writeFile(filePath, html, 'utf8');
      
      results.push({
        slug: post.slug,
        path: filePath,
        title: metadata.title,
        success: true
      });
      
      console.log(`✓ Generated: /blog/${post.slug}.html`);
    } catch (error) {
      console.error(`✗ Failed to generate OG file for ${post.slug}:`, error);
      results.push({
        slug: post.slug,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function generateBuildSummary(results) {
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    generatedAt: new Date().toISOString(),
    files: results
  };

  const summaryPath = path.join(process.cwd(), 'public', 'blog', '_build-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  
  console.log('\n📊 Build Summary:');
  console.log(`Total posts: ${summary.total}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Failed: ${summary.failed}`);
  
  if (summary.failed > 0) {
    console.log('\n❌ Failed files:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.slug}: ${r.error}`);
    });
  }

  return summary;
}

async function main() {
  try {
    console.log('🚀 Starting static OG HTML generation...\n');
    
    // Fetch published blog posts
    const posts = await fetchPublishedBlogPosts();
    
    if (posts.length === 0) {
      console.log('No published blog posts found. Skipping OG generation.');
      return;
    }
    
    // Generate static OG files
    const results = await generateStaticOGFiles(posts);
    
    // Generate build summary
    await generateBuildSummary(results);
    
    console.log('\n✅ Static OG HTML generation complete!');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the script
main();