import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';
import { 
  isSocialMediaCrawler, 
  generateBlogSEOMetadata, 
  generateCrawlerHTML, 
  generateErrorHTML, 
  generateServerErrorHTML,
  SEO_CONSTANTS
} from '../_shared/seo-utils.ts';

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
  const isCrawler = isSocialMediaCrawler(userAgent);

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
        return new Response(generateErrorHTML(slug), {
          headers: { 'Content-Type': 'text/html' }
        });
      } else {
        // Redirect regular users to the main site
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${SEO_CONSTANTS.siteUrl}/blog` }
        });
      }
    }

    if (isCrawler) {
      // Serve static HTML with OG metadata for crawlers
      const seoMetadata = generateBlogSEOMetadata(post);
      const html = generateCrawlerHTML(seoMetadata);

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
        headers: { 'Location': `${SEO_CONSTANTS.siteUrl}/blog/${slug}` }
      });
    }

  } catch (error) {
    console.error('Error in blog OG handler:', error);
    
    if (isCrawler) {
      return new Response(generateServerErrorHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SEO_CONSTANTS.siteUrl}/blog` }
      });
    }
  }
});