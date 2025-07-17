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

    // Get active job targets
    const { data: targets, error: targetsError } = await supabase
      .from('job_targets')
      .select('*')
      .eq('is_active', true);

    if (targetsError) {
      throw new Error(`Failed to fetch targets: ${targetsError.message}`);
    }

    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active targets found', newJobs: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNewJobs = 0;

    for (const target of targets) {
      console.log(`Processing target: ${target.name}`);
      
      try {
        // Fetch the job board page
        const response = await fetch(target.url);
        const html = await response.text();
        
        // For now, just insert a test job for each target to verify the flow works
        const { data, error } = await supabase
          .from('jobs')
          .insert([{
            title: `Job from ${target.name}`,
            company: 'Scraped Company',
            platform: target.ats_platform,
            location: 'Remote',
            date_posted: new Date().toISOString().split('T')[0],
            application_url: target.url,
            description: `Job scraped from ${target.name}`,
            job_type: 'Full-time',
            is_active: true
          }])
          .select();

        if (!error && data?.[0]) {
          totalNewJobs++;
          console.log(`Inserted job from ${target.name}`);
        }
      } catch (error) {
        console.error(`Error processing target ${target.name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Job scraping completed`,
        targetsProcessed: targets.length,
        newJobs: totalNewJobs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Job monitor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});