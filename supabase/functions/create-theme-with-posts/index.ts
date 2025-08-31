import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OPENAI_CONFIG } from '../_shared/config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThemeRequest {
  description: string;
}

serve(async (req) => {
  const startTime = Date.now();
  const correlationId = `create-theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔵 [INIT] 🚀 CREATE THEME WITH POSTS START`, {
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
      correlationId
    });

    // Generate theme using dedicated theme generation function
    console.log(`🔵 [THEME] Calling generate-custom-theme function`, {
      description: body.description,
      correlationId
    });

    const { data: themeResponse, error: themeError } = await supabase.functions.invoke('generate-custom-theme', {
      body: { description: body.description }
    });

    if (themeError || !themeResponse?.success) {
      console.error(`❌ [THEME] Theme generation failed`, {
        themeError,
        themeData: themeResponse,
        correlationId
      });
      throw new Error('Failed to generate theme');
    }

    const themeData = themeResponse.themeData;

    console.log(`✅ [THEME] Theme generated successfully`, {
      theme: themeData.theme,
      category: themeData.category,
      postCount: themeData.posts?.length,
      correlationId
    });

    // Create theme record
    const { data: theme, error: themeCreationError } = await supabase
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

    if (themeCreationError) {
      console.error(`❌ [THEME] Failed to create theme`, {
        error: themeCreationError,
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
      posts_created: posts.length
    };

    console.log(`✅ [COMPLETE] Theme creation completed successfully`, {
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
    console.error(`❌ [ERROR] Theme creation failed`, {
      error: error.message,
      duration: `${totalDuration}ms`,
      correlationId
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});