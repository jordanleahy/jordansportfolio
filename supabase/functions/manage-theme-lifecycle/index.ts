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
  // Handle CORS preflight requests
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

    const body: ThemeLifecycleRequest = await req.json();
    console.log('Theme lifecycle request:', body);

    if (body.action === 'create') {
      if (!body.description) {
        throw new Error('Description is required for create action');
      }

      console.log('Creating theme with lifecycle management...');
      
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

      if (themeError || !themeData?.success) {
        throw new Error(themeData?.error || 'Failed to generate theme');
      }

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
        console.error('Failed to update theme lifecycle:', updateError);
      }

      // Start background processing using waitUntil
      EdgeRuntime.waitUntil(
        processThemeInBackground(supabase, themeData.theme_id, user.id)
      );

      return new Response(
        JSON.stringify({
          success: true,
          theme_id: themeData.theme_id,
          lifecycle_status: 'generating',
          message: 'Theme created and background processing started'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.action === 'complete') {
      if (!body.themeId) {
        throw new Error('Theme ID is required for complete action');
      }

      console.log('Marking theme as user-completed:', body.themeId);

      const { error: updateError } = await supabase
        .from('themes')
        .update({
          lifecycle_status: 'completed',
          user_interaction_required: false
        })
        .eq('id', body.themeId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to mark theme as completed');
      }

      return new Response(
        JSON.stringify({
          success: true,
          lifecycle_status: 'completed',
          message: 'Theme marked as completed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (body.action === 'status') {
      if (!body.themeId) {
        throw new Error('Theme ID is required for status action');
      }

      const { data: theme, error: fetchError } = await supabase
        .from('themes')
        .select('lifecycle_status, user_interaction_required, background_processing_complete')
        .eq('id', body.themeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch theme status');
      }

      return new Response(
        JSON.stringify({
          success: true,
          theme_id: body.themeId,
          lifecycle_status: theme.lifecycle_status,
          user_interaction_required: theme.user_interaction_required,
          background_processing_complete: theme.background_processing_complete
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else {
      throw new Error('Invalid action. Must be create, complete, or status');
    }

  } catch (error) {
    console.error('Theme lifecycle error:', error);
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

async function processThemeInBackground(supabase: any, themeId: string, userId: string) {
  try {
    console.log('Starting background processing for theme:', themeId);
    
    // Wait for all post prompts to be completed
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    
    while (!processingComplete && attempts < maxAttempts) {
      const { data: theme, error } = await supabase
        .from('themes')
        .select('prompt_generation_status, prompt_completion_count, total_posts_count')
        .eq('id', themeId)
        .single();
        
      if (error) {
        console.error('Error checking theme progress:', error);
        break;
      }
      
      if (theme.prompt_generation_status === 'completed' && 
          theme.prompt_completion_count === theme.total_posts_count) {
        processingComplete = true;
        console.log('Background processing completed for theme:', themeId);
        break;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    
    // Update theme to mark background processing as complete
    const { error: updateError } = await supabase
      .from('themes')
      .update({
        background_processing_complete: true,
        lifecycle_status: processingComplete ? 'ready' : 'generating'
      })
      .eq('id', themeId);
      
    if (updateError) {
      console.error('Failed to update background processing status:', updateError);
    }
    
  } catch (error) {
    console.error('Background processing error:', error);
  }
}