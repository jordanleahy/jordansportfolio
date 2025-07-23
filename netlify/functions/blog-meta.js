const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event, context) => {
  // Add debugging
  console.log('Blog meta function called with:', {
    slug: event.queryStringParameters?.slug,
    userAgent: event.headers['user-agent'],
    method: event.httpMethod
  });

  const { slug } = event.queryStringParameters || {};
  
  if (!slug) {
    console.log('Missing slug parameter');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing slug parameter' })
    };
  }

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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Blog post not found' })
      };
    }

    console.log('Found blog post:', {
      meta_title: post.meta_title,
      hero_headline: post.hero_headline,
      meta_description: post.meta_description,
      intro_content: post.intro_content,
      og_image_url: post.og_image_url,
      hero_image_url: post.hero_image_url,
      published_at: post.published_at
    });

    // Use the correct domain - jordanleahy.com
    const siteUrl = 'https://jordanleahy.com';
    const postUrl = `${siteUrl}/blog/${post.slug}`;

    // Determine the best image to use - prefer domain-hosted images
    const ogImage = post.og_image_url || post.hero_image_url || `${siteUrl}/og-default.png`;

    // Escape HTML entities in content
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Get proper metadata with fallbacks (note: there is no 'title' field in blog_posts schema)
    const title = post.meta_title || post.hero_headline || 'Jordan Leigh - Healthcare Product Designer';
    const description = post.meta_description || post.intro_content || 'Healthcare Product Designer specializing in user-centered design solutions that improve patient experiences and clinical workflows.';
    
    console.log('Using metadata:', {
      finalTitle: title,
      finalDescription: description,
      finalImage: ogImage,
      publishedAt: post.published_at || post.created_at
    });

    // Generate the HTML with proper OG tags
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
    <meta property="article:published_time" content="${post.published_at || post.created_at}">
    <meta property="article:author" content="Jordan Leigh">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImage}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${postUrl}">
    
    <!-- Redirect to actual blog post -->
    <meta http-equiv="refresh" content="0;url=/blog/${post.slug}">
    <script>
      window.location.href = '/blog/${post.slug}';
    </script>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <p>If you are not redirected automatically, <a href="/blog/${post.slug}">click here</a>.</p>
</body>
</html>`;

    console.log('Generated HTML with OG tags for:', post.slug);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: html
    };

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};