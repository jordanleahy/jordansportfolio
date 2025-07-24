import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialMediaPost {
  title: string;
  description: string;
  day?: number;
  theme?: string;
  category?: string;
}

interface BlogPostInput {
  user_id: string;
  day?: number;
  status: string;
  hero_headline: string;
  hero_subhead: string;
  hero_badge?: string;
  intro_content: string;
  visual_sections: Array<{
    headline: string;
    content: string;
    image_url?: string;
    cta_text?: string;
    cta_url?: string;
  }>;
  tldr_title: string;
  tldr_bullets: string[];
  deep_dive_title?: string;
  deep_dive_content?: string;
  cta_text: string;
  cta_url?: string;
  meta_title: string;
  meta_description: string;
  meta_keywords?: string[];
  category: string;
  tags?: string[];
  slug: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { socialMediaPost, checkExisting = false } = await req.json();
    
    if (!socialMediaPost) {
      throw new Error('Social media post data is required');
    }

    console.log('Processing blog generation for:', socialMediaPost.title);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Specialized blog content generation prompt
    const blogPrompt = `You are an expert healthcare content strategist and blog writer specializing in healthcare technology, clinical documentation, and revenue cycle management.

Your task is to transform the following social media post into a comprehensive, authoritative blog post that provides deep value to healthcare professionals.

SOCIAL MEDIA POST:
Title: ${socialMediaPost.title}
Description: ${socialMediaPost.description}
Category: ${socialMediaPost.category || 'healthcare'}
Theme: ${socialMediaPost.theme || 'general'}

BLOG POST REQUIREMENTS:

1. **Target Audience**: Healthcare executives, clinical documentation specialists, revenue cycle managers, and healthcare IT professionals

2. **Tone**: Professional yet accessible, authoritative but not condescending, practical and actionable

3. **Structure**: Create a comprehensive blog post that expands significantly on the social media content while maintaining accuracy and providing actionable insights

4. **SEO Optimization**: Include relevant healthcare industry keywords naturally within the content

5. **Value Proposition**: Each section should provide specific, actionable insights that readers can implement

OUTPUT FORMAT (JSON):
{
  "hero_headline": "Compelling headline (60-80 characters, include main keyword)",
  "hero_subhead": "Engaging subheadline that expands on the headline (120-160 characters)",
  "hero_badge": "Category badge (e.g., 'Clinical Documentation', 'Revenue Cycle', 'Healthcare AI')",
  "intro_content": "Hook paragraph that introduces the topic and why it matters (150-200 words)",
  "visual_sections": [
    {
      "headline": "Section 1 headline (max 40 characters)",
      "content": "Detailed content for this section (300-480 words with specific examples, best practices, and actionable insights)"
    },
    {
      "headline": "Section 2 headline (max 40 characters)", 
      "content": "Detailed content for this section (300-480 words with case studies, implementation tips, or industry data)"
    },
    {
      "headline": "Section 3 headline (max 40 characters)",
      "content": "Detailed content for this section (300-480 words with future implications, recommendations, or strategic considerations)"
    }
  ],
  "tldr_bullets": [
    "Key takeaway 1 (concise, actionable)",
    "Key takeaway 2 (concise, actionable)", 
    "Key takeaway 3 (concise, actionable)",
    "Key takeaway 4 (concise, actionable)"
  ],
  "deep_dive_title": "Optional deep dive section title",
  "deep_dive_content": "Optional deeper analysis or technical details (200-400 words)",
  "cta_text": "Learn more about [relevant topic]",
  "meta_title": "SEO-optimized title (50-60 characters)",
  "meta_description": "SEO meta description (150-160 characters)",
  "category": "${socialMediaPost.category || 'healthcare'}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Focus on providing genuine value, specific examples, and actionable insights that healthcare professionals can use to improve their operations, compliance, or patient outcomes.`;

    console.log('Calling OpenAI API for blog content generation...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert healthcare content strategist. Always respond with valid JSON that matches the exact structure requested.'
          },
          {
            role: 'user',
            content: blogPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIResponse = await response.json();
    const generatedContent = openAIResponse.choices[0].message.content;

    console.log('OpenAI response received, parsing content...');

    // Parse the JSON response
    let parsedContent;
    try {
      // Clean up potential markdown formatting
      const cleanContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', generatedContent);
      throw new Error('Failed to parse AI-generated content');
    }

    // Validate and ensure visual_sections has exactly 3 sections
    function validateVisualSections(sections: any[]): any[] {
      if (!Array.isArray(sections) || sections.length !== 3) {
        console.log('Visual sections validation failed, creating fallback sections');
        return [
          {
            headline: "Understanding the Basics",
            content: "This section provides foundational knowledge about the topic, helping readers understand the core concepts and why they matter in today's healthcare environment. We'll explore the key components and how they impact daily operations."
          },
          {
            headline: "Implementation Strategies", 
            content: "Here we dive into practical approaches for implementing these concepts in real-world healthcare settings. This includes best practices, common challenges, and proven strategies that have shown success across different organizations."
          },
          {
            headline: "Future Considerations",
            content: "Looking ahead, this section examines emerging trends and future developments that will shape this area. We'll discuss how to prepare for upcoming changes and position your organization for continued success."
          }
        ];
      }
      return sections.map(section => ({
        headline: section.headline || "Section Headline",
        content: section.content || "Content for this section will provide valuable insights and practical information for healthcare professionals.",
        image_url: section.image_url || null,
        cta_text: section.cta_text || null,
        cta_url: section.cta_url || null
      }));
    }

    // Generate slug from title
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };

    // Construct the blog post input
    const blogPostData: BlogPostInput = {
      user_id: '', // Will be set from auth
      day: socialMediaPost.day || null,
      status: 'draft',
      hero_headline: parsedContent.hero_headline || socialMediaPost.title,
      hero_subhead: parsedContent.hero_subhead || socialMediaPost.description,
      hero_badge: parsedContent.hero_badge || socialMediaPost.category || 'Healthcare',
      intro_content: parsedContent.intro_content || socialMediaPost.description,
      visual_sections: validateVisualSections(parsedContent.visual_sections || []),
      tldr_title: 'TL;DR',
      tldr_bullets: parsedContent.tldr_bullets || ['Key insight 1', 'Key insight 2', 'Key insight 3', 'Key insight 4'],
      deep_dive_title: parsedContent.deep_dive_title || null,
      deep_dive_content: parsedContent.deep_dive_content || null,
      cta_text: parsedContent.cta_text || 'Learn more about healthcare innovation',
      cta_url: parsedContent.cta_url || null,
      meta_title: parsedContent.meta_title || parsedContent.hero_headline || socialMediaPost.title,
      meta_description: parsedContent.meta_description || parsedContent.hero_subhead || socialMediaPost.description,
      meta_keywords: parsedContent.tags || [socialMediaPost.category || 'healthcare'],
      category: parsedContent.category || socialMediaPost.category || 'healthcare',
      tags: parsedContent.tags || [socialMediaPost.category || 'healthcare'],
      slug: generateSlug(parsedContent.hero_headline || socialMediaPost.title)
    };

    console.log('Blog post data constructed, initializing Supabase...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration not found');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    blogPostData.user_id = user.id;

    // Check for existing blog post if requested
    if (checkExisting) {
      console.log('Checking for existing blog posts...');
      const { data: existingPosts } = await supabase
        .from('blog_posts')
        .select('id, hero_headline')
        .eq('user_id', user.id)
        .ilike('hero_headline', `%${parsedContent.hero_headline}%`)
        .limit(1);

      if (existingPosts && existingPosts.length > 0) {
        return new Response(
          JSON.stringify({
            exists: true,
            existing_post: existingPosts[0],
            message: 'A similar blog post already exists'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique slug
    let finalSlug = blogPostData.slug;
    let counter = 1;
    while (true) {
      const { data: existingSlug } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', finalSlug)
        .limit(1);

      if (!existingSlug || existingSlug.length === 0) {
        break;
      }
      finalSlug = `${blogPostData.slug}-${counter}`;
      counter++;
    }
    blogPostData.slug = finalSlug;

    console.log('Inserting blog post into database...');

    // Insert the blog post
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    console.log('Blog post created successfully:', insertedPost.id);

    const redirectUrl = `/admin-blog/${insertedPost.id}`;

    return new Response(
      JSON.stringify({
        success: true,
        blog_post: insertedPost,
        redirect_url: redirectUrl,
        message: 'Blog post draft created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate blog content',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});