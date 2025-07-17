import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialMediaPost {
  id: string;
  title: string;
  description: string;
  category: string;
  image_16_9_url?: string | null;
  image_4_3_url?: string | null;
}

interface BlogPostInput {
  hero_headline: string;
  hero_subhead: string;
  hero_image_url?: string | null;
  intro_content: string;
  visual_sections: any[];
  tldr_title: string;
  tldr_bullets: string[];
  meta_title: string;
  meta_description: string;
  category: string;
  tags: string[];
  cta_text: string;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { socialMediaPost } = await req.json() as { socialMediaPost: SocialMediaPost };

    if (!socialMediaPost) {
      throw new Error('Social media post data is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate expanded blog content using OpenAI
    const prompt = `Transform this social media post into a comprehensive blog post. EXPAND the existing content thoughtfully, don't create entirely new content.

Original Title: "${socialMediaPost.title}"
Original Description: "${socialMediaPost.description}"
Category: "${socialMediaPost.category}"

Generate a JSON response with the following structure:
{
  "hero_headline": "Expanded engaging headline (6-8 words max)",
  "hero_subhead": "Supporting subheadline (10-15 words)",
  "intro_content": "Expanded introduction (50-75 words) that builds on the original description",
  "visual_sections": [
    {
      "headline": "Section 1 headline (5-6 words)",
      "content": "Content that breaks down part of the main concept (60-80 words)",
      "image_url": null,
      "cta_text": null,
      "cta_url": null
    },
    {
      "headline": "Section 2 headline (5-6 words)", 
      "content": "Content that explores another aspect (60-80 words)",
      "image_url": null,
      "cta_text": null,
      "cta_url": null
    },
    {
      "headline": "Section 3 headline (5-6 words)",
      "content": "Content that provides practical insights (60-80 words)", 
      "image_url": null,
      "cta_text": null,
      "cta_url": null
    }
  ],
  "tldr_bullets": [
    "Key point 1 (10-15 words)",
    "Key point 2 (10-15 words)", 
    "Key point 3 (10-15 words)",
    "Key point 4 (10-15 words)"
  ],
  "meta_title": "SEO-optimized title (50-60 characters)",
  "meta_description": "SEO description (140-160 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Stay focused on expanding the original concept, don't add unrelated content
- Maintain professional, educational tone
- Use healthcare/business terminology appropriately for the category
- Keep word counts within specified limits
- Make content actionable and informative`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert content strategist who transforms social media posts into comprehensive blog posts. Focus on expanding existing content thoughtfully rather than creating entirely new content. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const generatedContent = aiData.choices[0].message.content;

    // Parse the generated JSON content
    let blogContent;
    try {
      blogContent = JSON.parse(generatedContent);
    } catch (error) {
      console.error('Failed to parse generated content:', generatedContent);
      throw new Error('Failed to parse generated content');
    }

    // Create the blog post input with proper structure
    const blogPostInput: BlogPostInput = {
      hero_headline: blogContent.hero_headline,
      hero_subhead: blogContent.hero_subhead,
      hero_image_url: socialMediaPost.image_16_9_url || null,
      intro_content: blogContent.intro_content,
      visual_sections: blogContent.visual_sections,
      tldr_title: 'TL;DR',
      tldr_bullets: blogContent.tldr_bullets,
      meta_title: blogContent.meta_title,
      meta_description: blogContent.meta_description,
      category: socialMediaPost.category,
      tags: blogContent.tags || [],
      cta_text: 'Learn More',
      status: 'draft'
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Generate slug from title
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 50);
    };

    const slug = generateSlug(blogPostInput.hero_headline);

    // Insert blog post into database
    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        user_id: user.id,
        hero_headline: blogPostInput.hero_headline,
        hero_subhead: blogPostInput.hero_subhead,
        hero_image_url: blogPostInput.hero_image_url,
        intro_content: blogPostInput.intro_content,
        visual_sections: blogPostInput.visual_sections,
        tldr_title: blogPostInput.tldr_title,
        tldr_bullets: blogPostInput.tldr_bullets,
        meta_title: blogPostInput.meta_title,
        meta_description: blogPostInput.meta_description,
        category: blogPostInput.category,
        tags: blogPostInput.tags,
        cta_text: blogPostInput.cta_text,
        slug: slug,
        status: 'draft',
        word_count: 0, // Will be calculated later
        read_time: 1, // Will be calculated later
        featured: false,
        share_enabled: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        blogPost: blogPost,
        message: 'Blog post draft created successfully',
        redirectUrl: `/blog-editor/${blogPost.id}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generic-blog function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});