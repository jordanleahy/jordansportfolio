import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const userAgent = req.headers.get('user-agent') || '';

  console.log('Blog OG handler called with:', { slug, userAgent: userAgent.substring(0, 100) });

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  // Detect social media crawlers
  const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|googlebot|bingbot|slackbot|discordbot/i.test(userAgent);

  console.log('Is crawler:', isCrawler);

  try {
    // Fetch blog post data
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      console.log('Blog post not found:', error);
      
      if (isCrawler) {
        // Return basic HTML for crawlers when post not found
        return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Post Not Found - Jordan Leigh</title>
    <meta name="description" content="Healthcare Product Designer specializing in user-centered design solutions.">
    <meta property="og:title" content="Blog Post Not Found - Jordan Leigh">
    <meta property="og:description" content="Healthcare Product Designer specializing in user-centered design solutions.">
    <meta property="og:image" content="https://jordanleahy.com/og-default.png">
    <meta property="og:url" content="https://jordanleahy.com/blog/${slug}">
    <meta property="og:type" content="website">
</head>
<body>
    <h1>Blog Post Not Found</h1>
    <p>The requested blog post could not be found.</p>
</body>
</html>`, {
          headers: { 'Content-Type': 'text/html' }
        });
      } else {
        // Redirect regular users to the main site
        return new Response(null, {
          status: 302,
          headers: { 'Location': `https://jordanleahy.com/blog` }
        });
      }
    }

    if (isCrawler) {
      // Serve static HTML with OG metadata for crawlers
      const siteUrl = 'https://jordanleahy.com';
      const postUrl = `${siteUrl}/blog/${post.slug}`;

      // Clean image URLs and ensure they're absolute
      const cleanImageUrl = (url: string | null) => {
        if (!url) return null;
        
        // If it's a relative URL, prepend the site domain
        if (url.startsWith('/')) {
          return `${siteUrl}${url}`;
        }
        
        // If it's absolute, remove double slashes
        return url.replace(/([^:]\/)\/+/g, '$1');
      };

      const ogImage = cleanImageUrl(post.og_image_url) || 
                     cleanImageUrl(post.hero_image_url) || 
                     `${siteUrl}/og-blog-template.png`;

      // Escape HTML entities
      const escapeHtml = (text: string) => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const title = post.meta_title || post.hero_headline || 'Jordan Leigh - Healthcare Product Designer';
      const description = post.meta_description || post.intro_content || 'Healthcare Product Designer specializing in user-centered design solutions that improve patient experiences and clinical workflows.';
      const publishedDate = (post.published_at || post.created_at) ? new Date(post.published_at || post.created_at).toISOString() : '';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Jordan Leigh">
    <meta property="article:published_time" content="${publishedDate}">
    <meta property="article:author" content="Jordan Leigh">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImage}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${postUrl}">
</head>
<body>
    <article>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <p>Published: ${publishedDate ? new Date(publishedDate).toLocaleDateString() : 'Unknown'}</p>
        <p><a href="${postUrl}">Read the full article on jordanleahy.com</a></p>
    </article>
</body>
</html>`;

      console.log('Serving OG HTML for crawler:', userAgent.substring(0, 50));

      return new Response(html, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        }
      });

    } else {
      // Redirect regular users to the SPA
      console.log('Redirecting regular user to SPA');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `https://jordanleahy.com/blog/${slug}` }
      });
    }

  } catch (error) {
    console.error('Error in blog OG handler:', error);
    
    if (isCrawler) {
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Jordan Leigh</title>
    <meta name="description" content="Healthcare Product Designer specializing in user-centered design solutions.">
    <meta property="og:title" content="Error - Jordan Leigh">
    <meta property="og:description" content="Healthcare Product Designer specializing in user-centered design solutions.">
    <meta property="og:image" content="https://jordanleahy.com/og-default.png">
    <meta property="og:url" content="https://jordanleahy.com">
    <meta property="og:type" content="website">
</head>
<body>
    <h1>Error</h1>
    <p>An error occurred while loading the blog post.</p>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      return new Response(null, {
        status: 302,
        headers: { 'Location': 'https://jordanleahy.com/blog' }
      });
    }
  }
});