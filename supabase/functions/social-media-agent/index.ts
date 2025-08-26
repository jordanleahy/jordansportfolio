import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { blog_post_id, platforms, custom_context } = await req.json();

    if (!blog_post_id || !platforms || !Array.isArray(platforms)) {
      throw new Error('Missing required parameters: blog_post_id and platforms array');
    }

    console.log('Generating social media content for blog post:', blog_post_id, 'platforms:', platforms);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Invalid authorization token');
    }

    const userId = userData.user.id;

    // Fetch blog post content
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blog_post_id)
      .eq('user_id', userId)
      .single();

    if (blogError || !blogPost) {
      throw new Error('Blog post not found or access denied');
    }

    // Fetch Social Media Agent
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('user_id', userId)
      .eq('name', 'Social Media Agent')
      .single();

    if (agentError || !agent) {
      throw new Error('Social Media Agent not found. Please create it first.');
    }

    // Fetch system prompts for requested platforms using standardized pattern
    const { data: systemPrompts, error: promptsError } = await supabase
      .from('system_prompts')
      .select('id, prompt_text, agent_name, theme_id')
      .eq('agent_id', agent.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (promptsError || !systemPrompts || systemPrompts.length === 0) {
      throw new Error('System prompts not found for requested platforms');
    }

    const results = [];

    // Use the most recent system prompt for all platforms
    const systemPrompt = systemPrompts[0];

    // Generate content for each platform
    for (const platform of platforms) {
      if (!systemPrompt) {
        console.log(`Skipping platform ${platform} - no system prompt found`);
        continue;
      }

      console.log(`Generating content for platform: ${platform}`);

      // Prepare blog content for AI
      const blogContent = `
Title: ${blogPost.hero_headline}
Subhead: ${blogPost.hero_subhead || ''}
Category: ${blogPost.category}
Tags: ${blogPost.tags?.join(', ') || ''}
Intro: ${blogPost.intro_content}
TL;DR: ${blogPost.tldr_bullets ? JSON.stringify(blogPost.tldr_bullets) : ''}
Deep Dive: ${blogPost.deep_dive_content || ''}
${custom_context ? `Additional Context: ${custom_context}` : ''}
`.trim();

      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model_version || 'gpt-5',
          messages: [
            {
              role: 'system',
              content: systemPrompt.prompt_text
            },
            {
              role: 'user',
              content: `Transform this blog post into platform-specific social media content:\n\n${blogContent}`
            }
          ],
          max_output_tokens: agent.max_tokens || 25000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error for ${platform}: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      const generatedContent = openaiData.choices[0].message.content;

      console.log(`Generated content for ${platform}:`, generatedContent.substring(0, 200) + '...');

      // Try to parse JSON response
      let parsedContent;
      try {
        parsedContent = JSON.parse(generatedContent);
      } catch (parseError) {
        console.log(`Failed to parse JSON for ${platform}, using raw content`);
        parsedContent = {
          platform: platform,
          content: generatedContent,
          hashtags: [],
          cta: "Read more on my blog!"
        };
      }

      results.push({
        platform: platform,
        ...parsedContent,
        generated_at: new Date().toISOString()
      });
    }

    // Track API usage
    try {
      await supabase.from('api_usage_tracking').insert({
        user_id: userId,
        function_name: 'social-media-agent',
        model_used: agent.model_version || 'gpt-5',
        request_type: 'text_generation',
        success: true,
        request_metadata: {
          blog_post_id,
          platforms,
          platforms_count: platforms.length
        },
        estimated_cost: 0.01 * platforms.length, // Rough estimate
        total_tokens: results.length * 500 // Rough estimate
      });
    } catch (trackingError) {
      console.error('Failed to track API usage:', trackingError);
    }

    return new Response(JSON.stringify({
      success: true,
      results: results,
      blog_post: {
        id: blogPost.id,
        title: blogPost.hero_headline
      },
      generated_count: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in social-media-agent function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});