const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event, context) => {
  const { slug } = event.queryStringParameters || {};
  
  if (!slug) {
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Blog post not found' })
      };
    }

    // Generate the HTML with proper OG tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.meta_title}</title>
    <meta name="description" content="${post.meta_description}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${post.meta_title}">
    <meta property="og:description" content="${post.meta_description}">
    <meta property="og:image" content="${post.og_image_url || post.hero_image_url}">
    <meta property="og:url" content="https://265639ae-98fe-47f5-888f-bed563c20e8d.lovableproject.com/blog/${post.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Jordan's Portfolio">
    <meta property="article:published_time" content="${post.published_at}">
    <meta property="article:author" content="Jordan Leigh">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.meta_title}">
    <meta name="twitter:description" content="${post.meta_description}">
    <meta name="twitter:image" content="${post.og_image_url || post.hero_image_url}">
    
    <!-- Redirect to actual blog post -->
    <meta http-equiv="refresh" content="0;url=/blog/${post.slug}">
    <script>
      window.location.href = '/blog/${post.slug}';
    </script>
</head>
<body>
    <h1>${post.title}</h1>
    <p>If you are not redirected automatically, <a href="/blog/${post.slug}">click here</a>.</p>
</body>
</html>`;

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