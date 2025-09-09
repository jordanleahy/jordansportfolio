/**
 * EDGE FUNCTION: Generate Share Content
 * 
 * PURPOSE:
 * Generates platform-optimized social media sharing content using emotional hook templates
 * for parenting and educational content.
 * 
 * INPUTS:
 * - post_id: string - ID of the social media post
 * - platform: string - Target platform (linkedin, twitter, facebook, instagram)
 * - hook_type: string - Type of emotional hook (parent_problem, community_engagement)
 * 
 * OUTPUTS:
 * - Success: { share_title: string, share_description: string }
 * - Error: { error: string, details: string }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { post_id, platform = 'linkedin', hook_type = 'parent_problem' } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!post_id) {
      throw new Error('Post ID is required');
    }

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch the post content
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select('title, description, category, theme')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    console.log(`Generating share content for platform: ${platform}, hook: ${hook_type}`);

    // Generate platform-specific character limits and formatting
    const platformSpecs = {
      linkedin: { title_limit: 150, description_limit: 1300, style: 'professional' },
      twitter: { title_limit: 100, description_limit: 280, style: 'concise' },
      facebook: { title_limit: 120, description_limit: 500, style: 'conversational' },
      instagram: { title_limit: 100, description_limit: 2200, style: 'visual_friendly' }
    };

    const specs = platformSpecs[platform as keyof typeof platformSpecs] || platformSpecs.linkedin;

    // Create the system prompt based on hook type and platform
    let hookTemplate = '';
    if (hook_type === 'parent_problem') {
      hookTemplate = `😤 "My child has [PROBLEM] and I don't know how to [SOLUTION]"

Sound familiar? 

This simple "[CONCEPT]" technique teaches kids to [BENEFIT].

💭 Want the complete guide? See comments 👇`;
    } else if (hook_type === 'community_engagement') {
      hookTemplate = `💭 Parents, what's your biggest [TOPIC] struggle?

Here's a technique that's helping families everywhere:

[SOLUTION DESCRIPTION]

Drop a 🙌 if you're trying this!`;
    }

    const systemPrompt = `You are an expert at creating viral, emotionally engaging social media content for parents and educators.

PLATFORM: ${platform.toUpperCase()}
CHARACTER LIMITS: Title max ${specs.title_limit}, Description max ${specs.description_limit}
STYLE: ${specs.style}

EMOTIONAL HOOK TEMPLATE:
${hookTemplate}

PSYCHOLOGICAL TRIGGERS TO INCLUDE:
- Emotional pain points (frustration, worry, overwhelm)
- Social proof through community validation
- Curiosity gaps that make parents want to learn more
- Clear benefits and outcomes
- Call-to-action for engagement

CONTENT RULES:
- Use emojis strategically for visual appeal
- Create urgency without being pushy
- Focus on transformation and hope
- Make it shareable and relatable
- Include specific, actionable insights

Generate a ${platform} post with:
1. A compelling title/hook (under ${specs.title_limit} chars)
2. A full description using the emotional template (under ${specs.description_limit} chars)

Make it feel authentic, not like marketing copy.`;

    const userPrompt = `Original Content:
Title: ${post.title}
Description: ${post.description}
Category: ${post.category || 'parenting'}
Theme: ${post.theme || 'child development'}

Transform this into an engaging ${platform} post using the ${hook_type} emotional hook template.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedContent = data.choices[0].message.content;

    // Parse the response to extract title and description
    const lines = generatedContent.split('\n').filter(line => line.trim());
    let share_title = '';
    let share_description = '';

    // Look for title/hook patterns
    const titleLine = lines.find(line => 
      line.includes('Title:') || 
      line.includes('Hook:') || 
      line.startsWith('😤') ||
      line.startsWith('💭')
    );

    if (titleLine) {
      share_title = titleLine.replace(/^(Title:|Hook:)\s*/i, '').trim();
    } else {
      // Use first line as title if no specific pattern found
      share_title = lines[0] || post.title;
    }

    // Use the rest as description, or the full content if no title was extracted
    if (titleLine) {
      const titleIndex = lines.indexOf(titleLine);
      share_description = lines.slice(titleIndex + 1).join('\n').trim();
    } else {
      share_description = generatedContent.trim();
    }

    // Ensure we respect character limits
    if (share_title.length > specs.title_limit) {
      share_title = share_title.substring(0, specs.title_limit - 3) + '...';
    }
    if (share_description.length > specs.description_limit) {
      share_description = share_description.substring(0, specs.description_limit - 3) + '...';
    }

    // Update the post with generated share content if user is authenticated
    if (userId) {
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({
          share_title,
          share_description,
          updated_at: new Date().toISOString()
        })
        .eq('id', post_id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating post:', updateError);
        // Don't throw, just log - we still want to return the generated content
      }
    }

    return new Response(JSON.stringify({ 
      share_title, 
      share_description,
      platform,
      hook_type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-share-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate share content. Please check your request and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});