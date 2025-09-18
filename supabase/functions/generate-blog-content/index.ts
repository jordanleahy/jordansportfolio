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

interface BlogContent {
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
  tldr_bullets: string[];
  deep_dive_title?: string;
  deep_dive_content?: string;
  cta_text: string;
  meta_title: string;
  meta_description: string;
  category: string;
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { socialMediaPost } = await req.json();
    
    if (!socialMediaPost) {
      throw new Error('Social media post data is required');
    }

    console.log('Processing blog generation for:', socialMediaPost.title);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Streamlined blog generation prompt
    const prompt = `Transform this social media post into a comprehensive blog post for healthcare professionals:

SOCIAL MEDIA POST:
Title: ${socialMediaPost.title}
Description: ${socialMediaPost.description}
Category: ${socialMediaPost.category || 'healthcare'}

OUTPUT FORMAT (JSON):
{
  "hero_headline": "Engaging headline (60-80 characters)",
  "hero_subhead": "Descriptive subheadline (120-160 characters)", 
  "hero_badge": "${socialMediaPost.category || 'Healthcare'}",
  "intro_content": "Hook paragraph introducing the topic (150-200 words)",
  "visual_sections": [
    {
      "headline": "Key Point 1 (max 40 chars)",
      "content": "Detailed explanation with practical insights (200-300 words)"
    },
    {
      "headline": "Key Point 2 (max 40 chars)",
      "content": "Implementation details and examples (200-300 words)"
    },
    {
      "headline": "Key Point 3 (max 40 chars)",
      "content": "Strategic recommendations and best practices (200-300 words)"
    }
  ],
  "tldr_bullets": [
    "Key takeaway 1",
    "Key takeaway 2", 
    "Key takeaway 3",
    "Key takeaway 4"
  ],
  "cta_text": "Learn more about ${socialMediaPost.category || 'healthcare innovation'}",
  "meta_title": "SEO title (50-60 characters)",
  "meta_description": "SEO description (150-160 characters)",
  "category": "${socialMediaPost.category || 'healthcare'}",
  "tags": ["tag1", "tag2", "tag3"]
}

Focus on actionable insights for healthcare professionals.`;

    console.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a healthcare content expert. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIResponse = await response.json();
    const generatedContent = openAIResponse.choices[0].message.content;

    console.log('Parsing AI response...');

    // Parse AI response with fallback
    let parsedContent: BlogContent;
    try {
      const cleanContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : cleanContent);
    } catch (parseError) {
      console.error('Parse error, using fallback:', parseError);
      parsedContent = createFallbackContent(socialMediaPost);
    }

    // Validate and normalize visual sections
    if (!parsedContent.visual_sections || !Array.isArray(parsedContent.visual_sections) || parsedContent.visual_sections.length !== 3) {
      parsedContent.visual_sections = createDefaultSections(socialMediaPost);
    }
    
    // Ensure each visual section has required fields with proper types
    parsedContent.visual_sections = parsedContent.visual_sections.map(section => ({
      headline: section.headline || 'Section Title',
      content: section.content || 'Section content goes here.',
      image_url: section.image_url || null,
      cta_text: section.cta_text || null,
      cta_url: section.cta_url || null
    }));

    // Generate slug
    const slug = parsedContent.hero_headline
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Prepare blog post data
    const blogPostData = {
      user_id: user.id,
      day: socialMediaPost.day || null,
      social_media_post_id: null,
      status: 'draft',
      slug,
      hero_headline: parsedContent.hero_headline,
      hero_subhead: parsedContent.hero_subhead,
      hero_badge: parsedContent.hero_badge,
      intro_content: parsedContent.intro_content,
      visual_sections: parsedContent.visual_sections,
      tldr_title: 'TL;DR',
      tldr_bullets: parsedContent.tldr_bullets,
      deep_dive_title: parsedContent.deep_dive_title,
      deep_dive_content: parsedContent.deep_dive_content,
      cta_text: parsedContent.cta_text,
      meta_title: parsedContent.meta_title,
      meta_description: parsedContent.meta_description,
      category: parsedContent.category,
      tags: parsedContent.tags,
      word_count: calculateWordCount(parsedContent),
      read_time: Math.ceil(calculateWordCount(parsedContent) / 200),
    };

    console.log('Inserting blog post...');

    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    console.log('Blog post created successfully:', blogPost.id);

    return new Response(JSON.stringify({
      success: true,
      blog_post: blogPost,
      redirect_url: `/blog-editor/${blogPost.id}`,
      message: 'Blog post created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function createFallbackContent(socialMediaPost: SocialMediaPost): BlogContent {
  return {
    hero_headline: socialMediaPost.title || 'Healthcare Innovation Insights',
    hero_subhead: socialMediaPost.description || 'Essential insights for healthcare professionals.',
    hero_badge: socialMediaPost.category || 'Healthcare',
    intro_content: socialMediaPost.description || 'This guide provides essential insights for healthcare professionals.',
    visual_sections: createDefaultSections(socialMediaPost),
    tldr_bullets: [
      'Key insight from the topic',
      'Important implementation takeaway',
      'Strategic advantage for organizations',
      'Best practice recommendation'
    ],
    deep_dive_title: 'Detailed Analysis',
    deep_dive_content: 'This section provides comprehensive analysis of the topic.',
    cta_text: `Learn more about ${socialMediaPost.category || 'healthcare innovation'}`,
    meta_title: socialMediaPost.title || 'Healthcare Innovation Guide',
    meta_description: socialMediaPost.description || 'Comprehensive healthcare insights.',
    category: socialMediaPost.category || 'healthcare',
    tags: [socialMediaPost.category || 'healthcare', 'best-practices', 'innovation']
  };
}

function createDefaultSections(socialMediaPost: SocialMediaPost) {
  return [
    {
      headline: "Core Concepts",
      content: "This section explores the fundamental concepts and why they matter in healthcare operations. Understanding these basics is essential for effective implementation and achieving sustainable results in your organization.",
      image_url: null,
      cta_text: null,
      cta_url: null
    },
    {
      headline: "Implementation Strategy", 
      content: "Here we examine practical approaches for implementing these concepts, including best practices, common challenges, and proven strategies that deliver measurable improvements in patient care and operational efficiency.",
      image_url: null,
      cta_text: null,
      cta_url: null
    },
    {
      headline: "Future Considerations",
      content: "Looking ahead, this section discusses emerging trends and strategic planning considerations that will help your organization prepare for upcoming changes and maintain competitive advantage in healthcare.",
      image_url: null,
      cta_text: null,
      cta_url: null
    }
  ];
}

function calculateWordCount(content: BlogContent): number {
  const allText = [
    content.intro_content,
    ...content.visual_sections.map(s => s.content),
    content.deep_dive_content || ''
  ].join(' ');
  
  return allText.split(/\s+/).filter(word => word.length > 0).length;
}