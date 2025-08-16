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

// Advanced logging utility
const logger = {
  info: (message: string, data?: any, context?: string) => {
    console.log(`🔵 [${context || 'LIFECYCLE'}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  success: (message: string, data?: any, context?: string) => {
    console.log(`✅ [${context || 'LIFECYCLE'}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any, context?: string) => {
    console.error(`❌ [${context || 'LIFECYCLE'}] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
  warn: (message: string, data?: any, context?: string) => {
    console.warn(`⚠️ [${context || 'LIFECYCLE'}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any, context?: string) => {
    console.log(`🔍 [${context || 'LIFECYCLE'}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

serve(async (req) => {
  const startTime = Date.now();
  const correlationId = `lifecycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('🚀 FUNCTION START', {
    correlationId,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    origin: req.headers.get('origin')
  }, 'INIT');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logger.debug('CORS preflight request handled', { correlationId }, 'CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.debug('Environment check', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
      correlationId
    }, 'ENV');

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided', { correlationId }, 'AUTH');
      throw new Error('No authorization header');
    }

    logger.debug('Authentication attempt', {
      authHeaderLength: authHeader.length,
      correlationId
    }, 'AUTH');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logger.error('Authentication failed', { authError, hasUser: !!user, correlationId }, 'AUTH');
      throw new Error('Authentication failed');
    }

    logger.success('User authenticated', {
      userId: user.id,
      email: user.email,
      correlationId
    }, 'AUTH');

    const body: ThemeLifecycleRequest = await req.json();
    logger.info('Request payload received', {
      action: body.action,
      hasDescription: !!body.description,
      hasThemeId: !!body.themeId,
      correlationId
    }, 'PAYLOAD');

    if (body.action === 'create') {
      if (!body.description) {
        logger.error('Missing description for create action', { correlationId }, 'VALIDATION');
        throw new Error('Description is required for create action');
      }

      logger.info('Starting theme creation with lifecycle', {
        description: body.description,
        userId: user.id,
        correlationId
      }, 'CREATE');
      
      const invokeStartTime = Date.now();
      // Call the existing theme generation function
      const { data: themeData, error: themeError } = await supabase.functions.invoke(
        'user-idea-streaming-image-pipeline',
        {
          body: {
            description: body.description,
            stream: false
          },
          headers: {
            Authorization: authHeader,
          }
        }
      );

      const invokeEndTime = Date.now();
      logger.info('Theme generation function completed', {
        duration: `${invokeEndTime - invokeStartTime}ms`,
        hasError: !!themeError,
        hasData: !!themeData,
        success: themeData?.success,
        correlationId
      }, 'INVOKE');

      if (themeError || !themeData?.success) {
        logger.error('Theme generation failed', {
          themeError,
          themeData,
          correlationId
        }, 'CREATE');
        throw new Error(themeData?.error || 'Failed to generate theme');
      }

      logger.success('Theme generated successfully', {
        themeId: themeData.theme_id,
        correlationId
      }, 'CREATE');

      // Update the created theme with lifecycle fields
      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'generating',
          user_interaction_required: true,
          background_processing_complete: false
        })
        .eq('id', themeData.theme_id);

      if (updateError) {
        logger.error('Failed to update theme lifecycle', { updateError, correlationId }, 'UPDATE');
      } else {
        logger.success('Theme lifecycle fields updated', {
          themeId: themeData.theme_id,
          status: 'generating',
          correlationId
        }, 'UPDATE');
      }

      // Start background processing (no waitUntil in Deno, use Promise.resolve)
      logger.info('Starting background processing', {
        themeId: themeData.theme_id,
        userId: user.id,
        correlationId
      }, 'BACKGROUND');

      processThemeInBackground(supabase, themeData.theme_id, user.id, correlationId)
        .catch(error => logger.error('Background processing error', { error, correlationId }, 'BACKGROUND'));

      const response = {
        success: true,
        theme_id: themeData.theme_id,
        lifecycle_status: 'generating',
        message: 'Theme created and background processing started',
        correlationId
      };

      const totalDuration = Date.now() - startTime;
      logger.success('CREATE action completed', {
        ...response,
        duration: `${totalDuration}ms`
      }, 'COMPLETE');

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.action === 'complete') {
      if (!body.themeId) {
        logger.error('Missing theme ID for complete action', { correlationId }, 'VALIDATION');
        throw new Error('Theme ID is required for complete action');
      }

      logger.info('Marking theme as user-completed', {
        themeId: body.themeId,
        userId: user.id,
        correlationId
      }, 'COMPLETE');

      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'completed',
          user_interaction_required: false
        })
        .eq('id', body.themeId)
        .eq('user_id', user.id);

      if (updateError) {
        logger.error('Failed to mark theme as completed', { updateError, correlationId }, 'UPDATE');
        throw new Error('Failed to mark theme as completed');
      }

      const response = {
        success: true,
        lifecycle_status: 'completed',
        message: 'Theme marked as completed',
        correlationId
      };

      const totalDuration = Date.now() - startTime;
      logger.success('COMPLETE action finished', {
        ...response,
        duration: `${totalDuration}ms`
      }, 'COMPLETE');

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.action === 'status') {
      if (!body.themeId) {
        logger.error('Missing theme ID for status action', { correlationId }, 'VALIDATION');
        throw new Error('Theme ID is required for status action');
      }

      logger.info('Fetching theme status', {
        themeId: body.themeId,
        userId: user.id,
        correlationId
      }, 'STATUS');

      const { data: theme, error: fetchError } = await supabase
        .from('themes')
        .select('lifecycle_status, user_interaction_required, background_processing_complete')
        .eq('id', body.themeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch theme status', { fetchError, correlationId }, 'STATUS');
        throw new Error('Failed to fetch theme status');
      }

      const response = {
        success: true,
        theme_id: body.themeId,
        lifecycle_status: theme.lifecycle_status,
        user_interaction_required: theme.user_interaction_required,
        background_processing_complete: theme.background_processing_complete,
        correlationId
      };

      const totalDuration = Date.now() - startTime;
      logger.success('STATUS action completed', {
        ...response,
        duration: `${totalDuration}ms`
      }, 'STATUS');

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else {
      logger.error('Invalid action provided', {
        action: body.action,
        validActions: ['create', 'complete', 'status'],
        correlationId
      }, 'VALIDATION');
      throw new Error('Invalid action. Must be create, complete, or status');
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logger.error('Function execution failed', {
      error: error.message,
      stack: error.stack,
      duration: `${totalDuration}ms`,
      correlationId
    }, 'ERROR');

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

async function processThemeInBackground(supabase: any, themeId: string, userId: string, correlationId: string) {
  const bgLogger = {
    info: (message: string, data?: any) => {
      console.log(`🔵 [BACKGROUND-${correlationId}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    success: (message: string, data?: any) => {
      console.log(`✅ [BACKGROUND-${correlationId}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
      console.error(`❌ [BACKGROUND-${correlationId}] ${message}`, error ? JSON.stringify(error, null, 2) : '');
    },
    warn: (message: string, data?: any) => {
      console.warn(`⚠️ [BACKGROUND-${correlationId}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    debug: (message: string, data?: any) => {
      console.log(`🔍 [BACKGROUND-${correlationId}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  };

  const bgStartTime = Date.now();
  
  try {
    bgLogger.info('Starting background processing', {
      themeId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Use shorter intervals and more robust checking
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes max (3 second intervals)
    const intervalMs = 3000;
    
    bgLogger.debug('Configuration set', {
      maxAttempts,
      intervalMs,
      totalTimeoutMs: 2 * 60 * 1000
    });
    
    // Add timeout mechanism
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        bgLogger.warn('Background processing timed out', {
          duration: `${2 * 60 * 1000}ms`,
          attempts
        });
        resolve(false);
      }, 2 * 60 * 1000); // 2 minutes total timeout
    });
    
    const checkingPromise = new Promise<boolean>(async (resolve) => {
      while (!processingComplete && attempts < maxAttempts) {
        try {
          const checkStartTime = Date.now();
          
          const { data: theme, error } = await supabase
            .from('themes')
            .select('prompt_generation_status, prompt_completion_count, total_posts_count, lifecycle_status')
            .eq('id', themeId)
            .single();
            
          const checkDuration = Date.now() - checkStartTime;
          
          if (error) {
            bgLogger.error('Database check failed', {
              error,
              attempt: attempts + 1,
              checkDuration: `${checkDuration}ms`
            });
            resolve(false);
            return;
          }
          
          bgLogger.debug('Theme status check', {
            attempt: attempts + 1,
            promptStatus: theme.prompt_generation_status,
            completionCount: theme.prompt_completion_count,
            totalCount: theme.total_posts_count,
            lifecycleStatus: theme.lifecycle_status,
            checkDuration: `${checkDuration}ms`
          });
          
          // Check if theme was marked as completed by user (race condition protection)
          if (theme.lifecycle_status === 'completed') {
            bgLogger.info('Theme already marked as completed by user', {
              themeId,
              attempt: attempts + 1
            });
            resolve(true);
            return;
          }
          
          if (theme.prompt_generation_status === 'completed' && 
              theme.prompt_completion_count === theme.total_posts_count &&
              theme.total_posts_count > 0) {
            processingComplete = true;
            bgLogger.success('Background processing completed naturally', {
              themeId,
              finalCompletionCount: theme.prompt_completion_count,
              totalPosts: theme.total_posts_count,
              attempts: attempts + 1
            });
            resolve(true);
            return;
          }
          
          attempts++;
          
          if (attempts < maxAttempts) {
            bgLogger.debug('Waiting before next check', {
              attempt: attempts,
              remainingAttempts: maxAttempts - attempts,
              waitTime: `${intervalMs}ms`
            });
            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }
        } catch (error) {
          bgLogger.error('Error in background processing loop', {
            error: error.message,
            attempt: attempts + 1,
            stack: error.stack
          });
          resolve(false);
          return;
        }
      }
      
      bgLogger.warn('Background processing loop exhausted', {
        maxAttempts,
        totalAttempts: attempts
      });
      resolve(false);
    });
    
    // Race between timeout and completion
    const completed = await Promise.race([timeoutPromise, checkingPromise]);
    
    // Update theme status regardless of completion
    const finalStatus = completed ? 'ready' : 'generating';
    const updateStartTime = Date.now();
    
    bgLogger.info('Updating final theme status', {
      completed,
      finalStatus,
      themeId
    });
    
    const { error: updateError } = await supabase
      .from('themes')
      .update({
        background_processing_complete: completed,
        lifecycle_status: finalStatus
      })
      .eq('id', themeId)
      .eq('lifecycle_status', 'generating'); // Only update if still generating (avoid race)
      
    const updateDuration = Date.now() - updateStartTime;
    const totalDuration = Date.now() - bgStartTime;
    
    if (updateError) {
      bgLogger.error('Failed to update background processing status', {
        updateError,
        updateDuration: `${updateDuration}ms`,
        totalDuration: `${totalDuration}ms`
      });
    } else {
      bgLogger.success('Background processing finished successfully', {
        themeId,
        finalStatus,
        completed,
        totalAttempts: attempts,
        updateDuration: `${updateDuration}ms`,
        totalDuration: `${totalDuration}ms`
      });
    }
    
  } catch (error) {
    const totalDuration = Date.now() - bgStartTime;
    bgLogger.error('Background processing failed with exception', {
      error: error.message,
      stack: error.stack,
      themeId,
      userId,
      totalDuration: `${totalDuration}ms`
    });
    
    // Try to mark as failed
    try {
      const { error: fallbackError } = await supabase
        .from('themes')
        .update({
          background_processing_complete: false,
          lifecycle_status: 'generating'
        })
        .eq('id', themeId);
        
      if (fallbackError) {
        bgLogger.error('Failed to update theme with error status', {
          fallbackError,
          themeId
        });
      } else {
        bgLogger.info('Theme status reset to generating after error', {
          themeId
        });
      }
    } catch (updateError) {
      bgLogger.error('Fallback update also failed', {
        updateError: updateError.message,
        themeId
      });
    }
  }
}