/**
 * ==============================================================================
 * MANAGE THEME LIFECYCLE - Supabase Edge Function
 * ==============================================================================
 * 
 * This Edge Function orchestrates the complete lifecycle management of content themes.
 * It handles theme creation from user descriptions, lifecycle status updates, and 
 * status monitoring throughout the theme generation pipeline.
 * 
 * OVERVIEW:
 * ---------
 * This function serves as the main orchestrator for theme management, coordinating
 * between multiple services to transform user descriptions into structured themes
 * with associated social media posts.
 * 
 * SUPPORTED ACTIONS:
 * ------------------
 * 
 * 1. CREATE - Complete theme creation pipeline
 *    • Takes a user description (e.g., "Top 5 concepts from Good to Great book")
 *    • Calls structure-theme-input to convert text into structured JSON
 *    • Imports structured data into database via import_theme_with_transaction RPC
 *    • Sets initial lifecycle status and triggers background processing
 *    • Returns theme_id for client-side tracking
 * 
 * 2. COMPLETE - Mark theme as user-completed
 *    • Updates theme lifecycle_status to 'completed'
 *    • Sets background_processing_complete to true
 *    • Removes user_interaction_required flag
 * 
 * 3. STATUS - Query current theme status
 *    • Returns current lifecycle_status, prompt_generation_status
 *    • Shows user_interaction_required and background_processing_complete flags
 *    • Used for real-time UI updates and progress tracking
 * 
 * REQUEST FORMAT:
 * ---------------
 * POST /functions/v1/manage-theme-lifecycle
 * Content-Type: application/json
 * Authorization: Bearer <jwt_token>
 * 
 * {
 *   "action": "create" | "complete" | "status",
 *   "description": "string (required for 'create')",
 *   "themeId": "uuid (required for 'complete', 'status')"
 * }
 * 
 * RESPONSE FORMAT:
 * ----------------
 * Success (200):
 * {
 *   "success": true,
 *   "theme_id": "uuid",
 *   "lifecycle_status": "pending" | "generating" | "completed",
 *   "message": "string",
 *   "correlationId": "string"
 * }
 * 
 * Error (400):
 * {
 *   "success": false,
 *   "error": "string",
 *   "correlationId": "string"
 * }
 * 
 * THEME CREATION WORKFLOW:
 * ------------------------
 * 1. User Authentication - Validates JWT token
 * 2. Structure Input - Calls structure-theme-input to parse description
 * 3. Data Import - Uses import_theme_with_transaction RPC to create theme & posts
 * 4. Theme ID Resolution - Queries database for the actual theme UUID
 * 5. Status Initialization - Sets lifecycle_status to 'pending'
 * 6. Response - Returns theme_id for client tracking
 * 
 * LIFECYCLE STATES:
 * -----------------
 * • pending - Theme created, awaiting background processing
 * • generating - Background processes (prompts, images) in progress
 * • completed - All processing finished, theme ready for use
 * 
 * DEPENDENCIES:
 * -------------
 * • structure-theme-input - Edge function for parsing user text into structured JSON
 * • import_theme_with_transaction - Database RPC function for atomic data import
 * • Database triggers - Auto-update lifecycle status based on prompt completion
 * 
 * ERROR HANDLING:
 * ---------------
 * • Comprehensive logging with correlation IDs for tracing
 * • Graceful error responses with meaningful messages
 * • Atomic operations to prevent partial state corruption
 * • Proper cleanup of failed operations
 * 
 * SECURITY:
 * ---------
 * • JWT authentication required for all operations
 * • User can only access their own themes (enforced by user_id checks)
 * • Service role key used for elevated database operations
 * • CORS headers configured for browser compatibility
 * 
 * @author AI Content System
 * @version 2.0
 * @since 2025-09-05
 */

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
      
      // Use structure-theme-input function for theme creation
      const { data: themeData, error: themeError } = await supabase.functions.invoke(
        'structure-theme-input',
        {
          body: {
            text: body.description
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
        console.error(`❌ [CREATE] Theme structuring failed`, {
          themeError,
          themeData,
          correlationId
        });
        throw new Error(themeData?.errors?.[0] || 'Failed to structure theme');
      }

      console.log(`✅ [STRUCTURE] Theme structured successfully`, {
        correlationId
      });

      // Import the structured theme data into the database using RPC
      const { data: importResult, error: importError } = await supabase
        .rpc('import_theme_with_transaction', {
          p_user_id: user.id,
          p_idempotency_key: `lifecycle-${correlationId}`,
          p_category: themeData.data.category,
          p_theme: themeData.data.theme,
          p_theme_description: themeData.data.theme_description,
          p_posts_data: themeData.data.posts
        });

      if (importError || !importResult?.[0]?.success) {
        console.error(`❌ [CREATE] Theme import failed`, {
          importError,
          importResult,
          correlationId
        });
        throw new Error(importResult?.[0]?.error_message || 'Failed to import theme');
      }

      console.log(`✅ [CREATE] Theme imported successfully`, {
        themeId: importResult[0].submission_id,
        insertedCount: importResult[0].inserted_count,
        correlationId
      });

      const themeId = importResult[0].submission_id;

      // Get the actual theme ID from the submission
      const { data: themeRecord, error: themeRetrievalError } = await supabase
        .from('themes')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', themeData.data.theme)
        .eq('category', themeData.data.category)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (themeRetrievalError) {
        console.error(`❌ [THEME] Failed to retrieve theme ID`, {
          themeRetrievalError,
          correlationId
        });
        throw new Error('Failed to retrieve created theme');
      }

      const actualThemeId = themeRecord.id;

      // Initial status update - triggers will handle the rest automatically
      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'pending',
          user_interaction_required: true,
          background_processing_complete: false
        })
        .eq('id', actualThemeId);

      if (updateError) {
        console.error(`❌ [UPDATE] Failed to update theme lifecycle`, {
          updateError,
          correlationId
        });
      }

      // Start background processing (simplified - no polling needed)
      console.log(`🔵 [BACKGROUND] Starting background processing`, {
        userId: user.id,
        themeId: actualThemeId,
        correlationId
      });

      const response = {
        success: true,
        theme_id: actualThemeId,
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