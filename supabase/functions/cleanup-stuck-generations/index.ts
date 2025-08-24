import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 CLEANUP: Starting stuck generation cleanup');

    // Call the cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_stuck_image_generations');

    if (cleanupError) {
      console.error('🧹 CLEANUP: Error:', cleanupError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cleanup failed', 
          details: cleanupError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    console.log('🧹 CLEANUP: Completed', { cleanedUp: cleanupResult });

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanedUp: cleanupResult,
        message: cleanupResult > 0 
          ? `Cleaned up ${cleanupResult} stuck generations` 
          : 'No stuck generations found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🧹 CLEANUP: Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Cleanup failed', 
        details: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});