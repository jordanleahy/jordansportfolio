import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert a test job
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        title: `Test Job ${new Date().toISOString()}`,
        company: 'Test Company',
        platform: 'job-monitor',
        location: 'Remote',
        date_posted: new Date().toISOString().split('T')[0],
        application_url: `https://example.com/test-${Date.now()}`,
        description: 'Test job inserted by job-monitor function',
        job_type: 'Full-time',
        is_active: true
      }])
      .select();

    if (error) {
      throw new Error(`Job insertion failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Job monitor test completed successfully',
        jobInserted: !!data?.[0],
        jobId: data?.[0]?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});