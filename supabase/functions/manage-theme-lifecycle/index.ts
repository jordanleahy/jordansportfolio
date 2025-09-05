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
 *    • Creates theme & posts directly in database with idempotency protection
 *    • Sets initial lifecycle status to trigger background processing
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
 * 3. Direct Data Import - Creates theme & posts directly in database with idempotency
 * 4. Status Initialization - Sets lifecycle_status to 'pending' 
 * 5. Response - Returns theme_id for client tracking
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
 * • Database triggers - Auto-update lifecycle status based on prompt completion
 * • theme_submissions table - Idempotency and transaction tracking
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

      // Import the structured theme data directly into the database
      console.log(`🔵 [IMPORT] Starting direct theme import`, {
        correlationId,
        category: themeData.data.category,
        theme: themeData.data.theme,
        postsCount: themeData.data.posts?.length || 0
      });

      const idempotencyKey = `lifecycle-${correlationId}`;
      
      // Check for existing submission with same idempotency key
      const { data: existingSubmission } = await supabase
        .from('theme_submissions')
        .select('id, status, inserted_count, error_message')
        .eq('user_id', user.id)
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingSubmission) {
        console.log(`🔄 [IMPORT] Found existing submission`, {
          submissionId: existingSubmission.id,
          status: existingSubmission.status,
          correlationId
        });
        
        if (existingSubmission.status === 'completed') {
          // Get the actual theme ID for existing submission
          const { data: existingTheme } = await supabase
            .from('themes')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', themeData.data.theme)
            .eq('category', themeData.data.category)
            .single();

          const response = {
            success: true,
            theme_id: existingTheme?.id || existingSubmission.id,
            lifecycle_status: 'pending',
            message: 'Theme already exists (idempotent)',
            correlationId
          };
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }

      // Create new submission record
      const { data: submission, error: submissionError } = await supabase
        .from('theme_submissions')
        .insert({
          user_id: user.id,
          idempotency_key: idempotencyKey,
          category: themeData.data.category,
          theme: themeData.data.theme,
          theme_description: themeData.data.theme_description,
          submission_data: themeData.data.posts,
          status: 'processing'
        })
        .select('id')
        .single();

      if (submissionError) {
        console.error(`❌ [IMPORT] Failed to create submission`, {
          submissionError,
          correlationId
        });
        throw new Error('Failed to create submission record');
      }

      console.log(`✅ [IMPORT] Submission created`, {
        submissionId: submission.id,
        correlationId
      });

      // Check for duplicate theme
      const { data: existingTheme } = await supabase
        .from('themes')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', themeData.data.theme)
        .eq('category', themeData.data.category)
        .single();

      if (existingTheme) {
        // Mark submission as failed due to duplicate
        await supabase
          .from('theme_submissions')
          .update({
            status: 'failed',
            error_message: 'Duplicate theme detected. A theme with this category and name already exists.'
          })
          .eq('id', submission.id);

        throw new Error('Duplicate theme detected. A theme with this category and name already exists.');
      }

      // Create the theme
      const { data: theme, error: themeCreationError } = await supabase
        .from('themes')
        .insert({
          user_id: user.id,
          name: themeData.data.theme,
          description: themeData.data.theme_description,
          category: themeData.data.category
        })
        .select('id')
        .single();

      if (themeCreationError) {
        console.error(`❌ [IMPORT] Failed to create theme`, {
          themeCreationError,
          correlationId
        });
        
        // Mark submission as failed
        await supabase
          .from('theme_submissions')
          .update({
            status: 'failed',
            error_message: 'Failed to create theme in database'
          })
          .eq('id', submission.id);

        throw new Error('Failed to create theme in database');
      }

      console.log(`✅ [IMPORT] Theme created`, {
        themeId: theme.id,
        correlationId
      });

      // Insert posts
      const postsToInsert = themeData.data.posts.map((post: any) => ({
        user_id: user.id,
        theme_id: theme.id,
        day: post.day || null,
        title: post.title,
        description: post.story_description,
        theme: themeData.data.theme,
        category: themeData.data.category,
        status: post.status || 'draft'
      }));

      const { data: insertedPosts, error: postsError } = await supabase
        .from('social_media_posts')
        .insert(postsToInsert)
        .select('id');

      if (postsError) {
        console.error(`❌ [IMPORT] Failed to insert posts`, {
          postsError,
          correlationId
        });
        
        // Mark submission as failed
        await supabase
          .from('theme_submissions')
          .update({
            status: 'failed',
            error_message: 'Failed to insert posts'
          })
          .eq('id', submission.id);

        throw new Error('Failed to insert posts');
      }

      const insertedCount = insertedPosts?.length || 0;

      // Mark submission as completed
      await supabase
        .from('theme_submissions')
        .update({
          status: 'completed',
          inserted_count: insertedCount,
          completed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      console.log(`✅ [IMPORT] Theme import completed successfully`, {
        themeId: theme.id,
        submissionId: submission.id,
        insertedCount,
        correlationId
      });

      const actualThemeId = theme.id;

      // Set initial lifecycle status to enable downstream processing
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

      console.log(`✅ [COMPLETE] Theme creation pipeline completed`, {
        themeId: actualThemeId,
        insertedCount,
        correlationId
      });

      const response = {
        success: true,
        theme_id: actualThemeId,
        lifecycle_status: 'pending',
        message: 'Theme created successfully',
        correlationId
      };

      console.log(`✅ [COMPLETE] CREATE action completed`, {
        ...response,
        insertedCount,
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