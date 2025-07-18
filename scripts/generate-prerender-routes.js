#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function generatePrerenderRoutes() {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      process.exit(1);
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      process.exit(1);
    }

    // Generate routes array
    const routes = [
      '/', // Homepage
      '/blog', // Blog listing page
      ...posts.map(post => `/blog/${post.slug}`) // Individual blog posts
    ];

    // Write routes to a file that Netlify can read
    const outputPath = path.join(process.cwd(), 'prerender-routes.json');
    fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2));
    
    console.log(`Generated ${routes.length} routes for prerendering:`);
    console.log(routes.join('\n'));
    
  } catch (error) {
    console.error('Failed to generate prerender routes:', error);
    process.exit(1);
  }
}

generatePrerenderRoutes();