
import { Context } from "https://edge.netlify.com/";

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'SkypeUriPreview',
  'SlackBot',
  'Discordbot',
  'GoogleBot',
  'bingbot'
];

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const lowerUA = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => 
    lowerUA.includes(crawler.toLowerCase())
  );
}

function generateBlogHTML(post: any, fullUrl: string): string {
  const ogImageUrl = post.og_image_url || post.hero_image_16_9_url || post.hero_image_url || 'https://www.jordanleahy.com/placeholder.svg';
  const fullTitle = `${post.meta_title} | Jordan Leigh Portfolio`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Basic Meta Tags -->
  <title>${fullTitle}</title>
  <meta name="description" content="${post.meta_description}">
  <meta name="author" content="Jordan Leigh">
  <link rel="canonical" href="${fullUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${post.meta_title}">
  <meta property="og:description" content="${post.meta_description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:url" content="${fullUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Jordan Leigh Portfolio">
  ${post.published_at ? `<meta property="article:published_time" content="${post.published_at}">` : ''}
  ${post.updated_at ? `<meta property="article:modified_time" content="${post.updated_at}">` : ''}
  <meta property="article:author" content="Jordan Leigh">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.meta_title}">
  <meta name="twitter:description" content="${post.meta_description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:site" content="@jordanleahy">
  
  <!-- SEO -->
  <meta name="robots" content="index, follow">
  ${post.meta_keywords ? `<meta name="keywords" content="${Array.isArray(post.meta_keywords) ? post.meta_keywords.join(', ') : post.meta_keywords}">` : ''}
  
  <script>
    // Redirect regular users to the SPA
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = '${fullUrl}';
    }
  </script>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
    <h1>${post.hero_headline || post.meta_title}</h1>
    <p style="font-size: 1.1rem; color: #666; margin: 1rem 0;">${post.hero_subhead || post.meta_description}</p>
    ${post.hero_image_url ? `<img src="${post.hero_image_url}" alt="${post.meta_title}" style="width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;">` : ''}
    <div style="margin: 2rem 0;">
      ${post.intro_content || ''}
    </div>
    <p style="color: #666; font-size: 0.9rem;">
      This is a preview for social sharing. <a href="${fullUrl}" style="color: #0066cc;">View the full article</a>.
    </p>
  </div>
</body>
</html>`;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  console.log('Blog Meta Edge Function:', {
    path: url.pathname,
    userAgent,
    isCrawler: isCrawler(userAgent)
  });

  // Only handle crawler requests
  if (!isCrawler(userAgent)) {
    // Let the SPA handle regular requests
    return;
  }

  // Extract slug from path like /blog/my-post-slug
  const pathMatch = url.pathname.match(/^\/blog\/([^\/]+)$/);
  if (!pathMatch) {
    return;
  }

  const slug = pathMatch[1];
  console.log('Fetching blog post for slug:', slug);

  try {
    // Fetch blog post from Supabase
    const supabaseUrl = 'https://wgwmzfbnkovumqcvsxgd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE';
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Supabase fetch error:', response.status, response.statusText);
      return;
    }

    const posts = await response.json();
    console.log('Supabase response:', posts);

    if (!posts || posts.length === 0) {
      console.log('No blog post found for slug:', slug);
      return;
    }

    const post = posts[0];
    const fullUrl = `https://www.jordanleahy.com/blog/${slug}`;
    
    console.log('Generating HTML for post:', post.meta_title);
    const html = generateBlogHTML(post, fullUrl);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300, s-maxage=3600' // Cache for 5 minutes, CDN for 1 hour
      }
    });

  } catch (error) {
    console.error('Error in blog-meta edge function:', error);
    return;
  }
}
