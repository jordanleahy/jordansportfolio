#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://wgwmzfbnkovumqcvsxgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SEO utilities for OG generation
const SEO_CONSTANTS = {
  siteUrl: 'https://app.lovable.dev',
  siteName: 'Lovable Blog',
  defaultTitle: 'Build Beautiful Apps with AI',
  defaultDescription: 'Create stunning web applications using AI-powered development tools',
  defaultImage: '/og-default.png',
  twitterHandle: '@lovabledev'
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
    author: 'Lovable Team',
    siteName: SEO_CONSTANTS.siteName,
    twitterHandle: SEO_CONSTANTS.twitterHandle
  };
}

function generateCrawlerHTML(metadata) {
  const escapedTitle = metadata.title.replace(/"/g, '&quot;');
  const escapedDescription = metadata.description.replace(/"/g, '&quot;');
  const escapedUrl = metadata.url.replace(/"/g, '&quot;');
  const escapedImage = metadata.image.replace(/"/g, '&quot;');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${metadata.type}">
  <meta property="og:url" content="${escapedUrl}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${escapedImage}">
  <meta property="og:site_name" content="${metadata.siteName}">
  ${metadata.publishedTime ? `<meta property="article:published_time" content="${metadata.publishedTime}">` : ''}
  ${metadata.author ? `<meta property="article:author" content="${metadata.author}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapedUrl}">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${escapedImage}">
  ${metadata.twitterHandle ? `<meta name="twitter:site" content="${metadata.twitterHandle}">` : ''}
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${escapedUrl}">
  <meta name="robots" content="index, follow">
  
  <!-- Redirect to SPA for regular users -->
  <script>
    // Simple crawler detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isCrawler = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
    
    if (!isCrawler) {
      window.location.replace('${escapedUrl}');
    }
  </script>
</head>
<body>
  <div style="max-width: 800px; margin: 40px auto; padding: 20px; font-family: system-ui, sans-serif;">
    <article>
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #1a1a1a;">${escapedTitle}</h1>
      <p style="font-size: 1.25rem; color: #666; line-height: 1.6;">${escapedDescription}</p>
      ${metadata.image !== SEO_CONSTANTS.defaultImage ? `
        <img src="${escapedImage}" alt="${escapedTitle}" style="width: 100%; max-width: 600px; height: auto; margin: 2rem 0; border-radius: 8px;">
      ` : ''}
      <p style="margin-top: 2rem;">
        <a href="${escapedUrl}" style="color: #0066cc; text-decoration: none;">Read the full article →</a>
      </p>
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