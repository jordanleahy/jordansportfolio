import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThemeLifecycleRequest {
  action: 'create' | 'complete' | 'status';
  description?: string;
  themeId?: string;
}

serve(async (req) => {
  const startTime = Date.now();
  const correlationId = `lifecycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔵 [INIT] 🚀 FUNCTION START`, {
    correlationId,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    origin: req.headers.get('origin')
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🔍 [CORS] CORS preflight request handled`, { correlationId });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 [ENV] Environment check`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
      correlationId
    });

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log(`🔍 [AUTH] Authentication attempt`, {
      authHeaderLength: authHeader.length,
      correlationId
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`✅ [AUTH] User authenticated`, {
      userId: user.id,
      email: user.email,
      correlationId
    });

    const body: ThemeLifecycleRequest = await req.json();
    console.log(`🔵 [PAYLOAD] Request payload received`, {
      action: body.action,
      hasDescription: !!body.description,
      hasThemeId: !!body.themeId,
      correlationId
    });

    if (body.action === 'create') {
      if (!body.description) {
        throw new Error('Description is required for create action');
      }

      console.log(`🔵 [CREATE] Starting theme creation with lifecycle`, {
        description: body.description,
        userId: user.id,
        correlationId
      });
      
      // Call the theme creation function
      const { data: themeData, error: themeError } = await supabase.functions.invoke(
        'create-theme-with-posts',
        {
          body: {
            description: body.description
          },
          headers: {
            Authorization: authHeader,
          }
        }
      );

      console.log(`🔵 [INVOKE] Theme generation function completed`, {
        duration: `${Date.now() - startTime}ms`,
        hasError: !!themeError,
        hasData: !!themeData,
        success: themeData?.success,
        correlationId
      });

      if (themeError || !themeData?.success) {
        console.error(`❌ [CREATE] Theme generation failed`, {
          themeError,
          themeData,
          correlationId
        });
        throw new Error(themeData?.error || 'Failed to generate theme');
      }

      console.log(`✅ [CREATE] Theme generated successfully`, {
        correlationId
      });

      // Initial status update - triggers will handle the rest automatically
      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'pending',
          user_interaction_required: true,
          background_processing_complete: false
        })
        .eq('id', themeData.theme_id);

      if (updateError) {
        console.error(`❌ [UPDATE] Failed to update theme lifecycle`, {
          updateError,
          correlationId
        });
      }

      // Start background processing (simplified - no polling needed)
      console.log(`🔵 [BACKGROUND] Starting background processing`, {
        userId: user.id,
        correlationId
      });

      const response = {
        success: true,
        theme_id: themeData.theme_id,
        lifecycle_status: 'generating',
        message: 'Theme created and background processing started',
        correlationId
      };

      console.log(`✅ [COMPLETE] CREATE action completed`, {
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

    } else if (body.action === 'complete') {
      if (!body.themeId) {
        throw new Error('Theme ID is required for complete action');
      }

      console.log(`🔵 [COMPLETE] Marking theme as user-completed`, {
        themeId: body.themeId,
        userId: user.id,
        correlationId
      });

      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'completed',
          user_interaction_required: false,
          background_processing_complete: true
        })
        .eq('id', body.themeId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`❌ [UPDATE] Failed to mark theme as completed`, {
          updateError,
          correlationId
        });
        throw new Error('Failed to mark theme as completed');
      }

      const response = {
        success: true,
        lifecycle_status: 'completed',
        message: 'Theme marked as completed',
        correlationId
      };

      console.log(`✅ [COMPLETE] COMPLETE action finished`, {
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

    } else if (body.action === 'status') {
      if (!body.themeId) {
        throw new Error('Theme ID is required for status action');
      }

      console.log(`🔵 [STATUS] Fetching theme status`, {
        themeId: body.themeId,
        userId: user.id,
        correlationId
      });

      const { data: theme, error: fetchError } = await supabase
        .from('themes')
        .select('lifecycle_status, user_interaction_required, background_processing_complete, prompt_generation_status')
        .eq('id', body.themeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error(`❌ [STATUS] Failed to fetch theme status`, {
          fetchError,
          correlationId
        });
        throw new Error('Failed to fetch theme status');
      }

      const response = {
        success: true,
        theme_id: body.themeId,
        lifecycle_status: theme.lifecycle_status,
        prompt_generation_status: theme.prompt_generation_status,
        user_interaction_required: theme.user_interaction_required,
        background_processing_complete: theme.background_processing_complete,
        correlationId
      };

      console.log(`✅ [STATUS] STATUS action completed`, {
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

    } else {
      throw new Error('Invalid action. Must be create, complete, or status');
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ [ERROR] Function execution failed`, {
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