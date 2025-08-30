import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded token limits for safety
const MAX_COMPLETION_TOKENS = 5000;
const MAX_PROMPT_TOKENS = 1000;

interface ThemeRequest {
  description: string;
  stream?: boolean;
}

serve(async (req) => {
  const startTime = Date.now();
  const correlationId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔵 [INIT] 🚀 PIPELINE START`, {
    correlationId,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`✅ [AUTH] User authenticated`, {
      userId: user.id,
      correlationId
    });

    let body: ThemeRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`❌ [PARSE] JSON parsing failed`, {
        error: parseError.message,
        correlationId
      });
      throw new Error('Invalid JSON in request body');
    }

    if (!body.description) {
      throw new Error('Description is required');
    }

    console.log(`🔵 [REQUEST] Processing theme generation`, {
      description: body.description,
      hasStream: !!body.stream,
      correlationId
    });

    // Generate theme content using OpenAI
    const systemPrompt = `You are an expert content strategist. Generate a comprehensive social media theme with exactly 5 posts based on the user's description. Each post should be educational, engaging, and valuable.

Return a JSON object with this exact structure:
{
  "theme": "brief theme name",
  "category": "content category",
  "posts": [
    {
      "day": 1,
      "title": "Post title",
      "description": "Detailed post content (100-200 words)"
    },
    ...5 posts total
  ]
}`;

    const userPrompt = `Create a 5-post social media series about: ${body.description}

Focus on educational content that provides real value. Each post should be substantial (100-200 words) and actionable.`;

    console.log(`🔵 [OPENAI] Calling GPT-5 for theme generation`, {
      promptLength: userPrompt.length,
      maxTokens: MAX_COMPLETION_TOKENS,
      correlationId
    });

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`❌ [OPENAI] API call failed`, {
        status: openaiResponse.status,
        error: errorText,
        correlationId
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    let themeData;
    
    try {
      themeData = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      console.error(`❌ [PARSE] OpenAI response parsing failed`, {
        error: parseError.message,
        content: openaiData.choices[0].message.content,
        correlationId
      });
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    console.log(`✅ [OPENAI] Theme generated successfully`, {
      theme: themeData.theme,
      category: themeData.category,
      postCount: themeData.posts?.length,
      correlationId
    });

    // Create theme record
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .insert({
        user_id: user.id,
        theme: themeData.theme,
        category: themeData.category,
        description: body.description,
        status: 'draft',
        lifecycle_status: 'pending',
        prompt_generation_status: 'not_started'
      })
      .select()
      .single();

    if (themeError) {
      console.error(`❌ [THEME] Failed to create theme`, {
        error: themeError,
        correlationId
      });
      throw new Error('Failed to create theme record');
    }

    console.log(`✅ [THEME] Theme created`, {
      themeId: theme.id,
      correlationId
    });

    // Create social media posts
    const posts = themeData.posts.map((post: any) => ({
      user_id: user.id,
      theme_id: theme.id,
      theme: themeData.theme,
      category: themeData.category,
      day: post.day,
      title: post.title,
      description: post.description,
      status: 'draft',
      individual_prompt_status: 'not_started'
    }));

    const { error: postsError } = await supabase
      .from('social_media_posts')
      .insert(posts);

    if (postsError) {
      console.error(`❌ [POSTS] Failed to create posts`, {
        error: postsError,
        correlationId
      });
      throw new Error('Failed to create social media posts');
    }

    console.log(`✅ [POSTS] Created ${posts.length} posts`, {
      themeId: theme.id,
      correlationId
    });

    const response = {
      success: true,
      theme_id: theme.id,
      theme: themeData.theme,
      category: themeData.category,
      posts_created: posts.length,
      correlationId
    };

    console.log(`✅ [COMPLETE] Pipeline completed successfully`, {
      ...response,
      duration: `${Date.now() - startTime}ms`
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ [ERROR] Pipeline execution failed`, {
      error: error.message,
      duration: `${totalDuration}ms`,
      correlationId
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});