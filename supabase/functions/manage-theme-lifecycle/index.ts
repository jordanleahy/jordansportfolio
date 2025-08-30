/**
 * ============= THEME LIFECYCLE MANAGEMENT EDGE FUNCTION =============
 * 
 * Manages the complete lifecycle of social media content themes including creation,
 * completion tracking, and status monitoring with real-time updates and background processing.
 * 
 * FUNCTION: manage-theme-lifecycle
 * PURPOSE: Orchestrates theme creation workflow with lifecycle management
 * 
 * INPUTS:
 * - action: 'create' | 'complete' | 'status' - The lifecycle action to perform
 * - description?: string - Theme description for creation (required for 'create')
 * - themeId?: string - Theme ID for status operations (required for 'complete'/'status')
 * - provider?: 'openai' | 'gemini' - AI provider preference (defaults to 'openai')
 * 
 * OUTPUTS:
 * - success: boolean - Operation success indicator
 * - theme_id?: string - Generated theme ID (for 'create' action)
 * - lifecycle_status: string - Current theme lifecycle status
 * - user_interaction_required?: boolean - Whether user interaction is needed
 * - background_processing_complete?: boolean - Background processing completion status
 * - message: string - Human-readable status message
 * - correlationId: string - Unique request correlation identifier
 * 
 * DEPENDENCIES:
 * - OpenAI model shared configuration (_shared/config.ts)
 * - Supabase (database persistence, authentication, edge function orchestration)
 * - generate-custom-theme edge function (for theme creation)
 * 
 * USAGE:
 * Called from: Theme management workflows, lifecycle tracking systems, dashboard updates
 * 
 * Authentication: Required (JWT token)
 * CORS: Enabled for web application integration
 * 
 * FLOW:
 * 1. CREATE: Validates input → Calls theme generation → Updates lifecycle status → Returns theme info
 * 2. COMPLETE: Validates theme ownership → Marks theme completed → Updates database → Confirms completion
 * 3. STATUS: Validates theme access → Fetches current status → Returns comprehensive status info
 * 
 * ERROR HANDLING: Comprehensive logging with correlation IDs, graceful degradation, detailed error responses
 */

// Import Deno standard library and XHR polyfill for consistency
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Import shared configuration constants
import { 
  ERROR_MESSAGES, 
  HTTP_CONFIG, 
  EDGE_FUNCTIONS,
  SUPABASE_CONFIG 
} from '../_shared/config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThemeLifecycleRequest {
  action: 'create' | 'complete' | 'status';
  description?: string;
  themeId?: string;
  provider?: 'openai' | 'gemini';
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
      throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }

    console.log(`🔍 [AUTH] Authentication attempt`, {
      authHeaderLength: authHeader.length,
      correlationId
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
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
        throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMS);
      }

      console.log(`🔵 [CREATE] Starting theme creation with lifecycle`, {
        description: body.description,
        userId: user.id,
        correlationId
      });
      
      // Call the theme generation function
      const { data: themeData, error: themeError } = await supabase.functions.invoke(
        EDGE_FUNCTIONS.GENERATE_CUSTOM_THEME,
        {
          body: {
            description: body.description,
            provider: body.provider || 'openai'
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
        throw new Error(themeData?.error || ERROR_MESSAGES.THEME_GENERATION_FAILED);
      }

      console.log(`✅ [CREATE] Theme generated successfully`, {
        correlationId,
        themeId: themeData?.theme_id || 'undefined'
      });

      // Validate theme_id exists before proceeding
      if (!themeData?.theme_id) {
        throw new Error(ERROR_MESSAGES.THEME_GENERATION_FAILED);
      }

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
          themeId: themeData.theme_id,
          correlationId
        });
        // Don't throw error here as theme was created successfully
        // The theme will still function, just lifecycle status won't be updated
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
          status: HTTP_CONFIG.STATUS_CODES.OK,
        }
      );

    } else if (body.action === 'complete') {
      if (!body.themeId) {
        throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMS);
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
        throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
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
          status: HTTP_CONFIG.STATUS_CODES.OK,
        }
      );

    } else if (body.action === 'status') {
      if (!body.themeId) {
        throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMS);
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
        throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
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
          status: HTTP_CONFIG.STATUS_CODES.OK,
        }
      );

    } else {
      throw new Error(ERROR_MESSAGES.INVALID_REQUEST_BODY);
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
        status: HTTP_CONFIG.STATUS_CODES.BAD_REQUEST,
      }
    );
  }
});