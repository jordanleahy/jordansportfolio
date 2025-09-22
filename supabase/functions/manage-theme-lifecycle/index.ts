import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThemeLifecycleRequest {
  action: 'create' | 'complete' | 'status' | 'start_processing' | 'restart_processing';
  description?: string;
  themeId?: string;
  userId?: string;
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

      // Generate a temporary theme ID for immediate response
      const tempThemeId = crypto.randomUUID();
      
      // Create initial theme record with generating status
      const { data: themeRecord, error: createError } = await supabase
        .from('themes')
        .insert({
          id: tempThemeId,
          user_id: user.id,
          theme_name: 'Generating...',
          category: 'generating',
          lifecycle_status: 'generating',
          user_interaction_required: false,
          background_processing_complete: false,
          prompt_generation_status: 'not_started'
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ [CREATE] Failed to create initial theme record`, {
          createError,
          correlationId
        });
        throw new Error('Failed to create theme record');
      }

      console.log(`✅ [CREATE] Initial theme record created`, {
        themeId: tempThemeId,
        correlationId
      });

      // Start background processing WITHOUT waiting for completion
      console.log(`🔵 [BACKGROUND] Starting background processing`, {
        userId: user.id,
        themeId: tempThemeId,
        correlationId
      });

      // Use proper Deno background processing instead of EdgeRuntime.waitUntil
      Promise.resolve().then(async () => {
        (async () => {
          try {
            console.log(`🔄 [BACKGROUND] Invoking theme generation pipeline`, {
              themeId: tempThemeId,
              correlationId
            });

            const { data: themeData, error: themeError } = await supabase.functions.invoke(
              'user-idea-streaming-image-pipeline',
              {
                body: {
                  description: body.description,
                  stream: false,
                  themeId: tempThemeId // Pass the theme ID for updates
                },
                headers: {
                  Authorization: authHeader,
                }
              }
            );

            console.log(`🔵 [BACKGROUND] Theme generation completed`, {
              duration: `${Date.now() - startTime}ms`,
              hasError: !!themeError,
              hasData: !!themeData,
              success: themeData?.success,
              correlationId
            });

            if (themeError || !themeData?.success) {
              console.error(`❌ [BACKGROUND] Theme generation failed`, {
                themeError,
                themeData,
                correlationId
              });
              
              // Update theme status to failed
              await supabase
                .from('themes')
                .update({
                  lifecycle_status: 'failed',
                  background_processing_complete: true
                })
                .eq('id', tempThemeId);
            } else {
              console.log(`✅ [BACKGROUND] Theme generation successful`, {
                correlationId
              });
              
              // Update theme status to completed
              await supabase
                .from('themes')
                .update({
                  lifecycle_status: 'completed',
                  background_processing_complete: true,
                  prompt_generation_status: 'completed'
                })
                .eq('id', tempThemeId);
            }
          } catch (bgError) {
            console.error(`❌ [BACKGROUND] Background processing failed`, {
              bgError: bgError.message,
              correlationId
            });
            
            // Update theme status to failed
            await supabase
              .from('themes')
              .update({
                lifecycle_status: 'failed',
                background_processing_complete: true
              })
              .eq('id', tempThemeId);
          }
        })();
      });

      const response = {
        success: true,
        theme_id: tempThemeId,
        lifecycle_status: 'generating',
        message: 'Theme creation started in background',
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

    } else if (body.action === 'start_processing' || body.action === 'restart_processing') {
      // Handle trigger-based processing start/restart
      if (!body.themeId || !body.userId) {
        throw new Error('Theme ID and user ID are required for processing actions');
      }

      console.log(`🔵 [PROCESSING] ${body.action} for theme`, {
        themeId: body.themeId,
        userId: body.userId,
        correlationId
      });

      // Check if posts exist for this theme
      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('id, individual_prompt_status')
        .eq('theme_id', body.themeId)
        .eq('user_id', body.userId);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      if (!posts || posts.length === 0) {
        console.log('No posts found for theme:', body.themeId);
        return new Response(
          JSON.stringify({ success: false, message: 'No posts found for theme' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${posts.length} posts for theme ${body.themeId}`);

      // Create system prompt first if it doesn't exist
      const { data: existingSystemPrompt } = await supabase
        .from('theme_system_prompts')
        .select('id')
        .eq('theme_id', body.themeId)
        .single();

      if (!existingSystemPrompt) {
        console.log('Creating system prompt for theme:', body.themeId);
        
        // Get theme details
        const { data: theme } = await supabase
          .from('themes')
          .select('category, theme_name, description')
          .eq('id', body.themeId)
          .single();

        if (theme) {
          const systemPromptText = `You are generating social media content for the theme "${theme.theme_name}" in the ${theme.category} category. ${theme.description || ''}`;
          
          await supabase
            .from('theme_system_prompts')
            .insert({
              theme_id: body.themeId,
              user_id: body.userId,
              system_prompt: systemPromptText,
              category: theme.category
            });
        }
      }

      // Start processing by updating post statuses to trigger existing pipelines
      console.log('Starting post processing by updating statuses...');
      
      try {
        // Reset all posts to in_progress to trigger existing processing
        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update({ 
            individual_prompt_status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('theme_id', body.themeId)
          .eq('user_id', body.userId)
          .eq('individual_prompt_status', 'not_started');

        if (updateError) {
          console.error('Error updating post statuses:', updateError);
          throw updateError;
        }

        console.log('Successfully updated post statuses to in_progress');

        // Also try to call the bulk function if it works
        const requests = posts.map(post => ({
          postId: post.id,
          aspectRatio: '1:1' // Default aspect ratio
        }));

        if (requests.length > 0) {
          const { data: bulkResult, error: bulkError } = await supabase.functions.invoke(
            'bulk-generate-prompts',
            {
              body: {
                requests: requests,
                themeId: body.themeId,
                batchSize: 5
              }
            }
          );

          if (bulkError) {
            console.log('Bulk function call failed, but post statuses updated:', bulkError);
          } else {
            console.log('Bulk generation also successful:', bulkResult);
          }
        }

      } catch (error) {
        console.error('Failed to start processing:', error);
        throw error;
      }

      // Update theme status
      await supabase
        .from('themes')
        .update({
          prompt_generation_status: 'in_progress',
          lifecycle_status: 'generating',
          user_interaction_required: true,
          background_processing_complete: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.themeId);

      const response = {
        success: true, 
        message: `Theme processing ${body.action === 'restart_processing' ? 'restarted' : 'started'}`,
        postsCount: posts.length,
        correlationId
      };

      console.log(`✅ [PROCESSING] ${body.action} completed`, {
        ...response,
        duration: `${Date.now() - startTime}ms`
      });

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid action. Must be create, complete, status, start_processing, or restart_processing');
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