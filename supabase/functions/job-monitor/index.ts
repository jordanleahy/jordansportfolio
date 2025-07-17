import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  console.log('[START] Job monitor function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Add health check endpoint
  if (req.method === 'GET') {
    console.log('[HEALTH] Health check requested');
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'job-monitor' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('[INIT] Starting job monitoring process...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log('[AUTH] Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic database connectivity
    console.log('[TEST] Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('[TEST] Database test failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('[TEST] Database connection successful');

    // Insert a single test job to verify insertion works
    console.log('[INSERT] Attempting to insert test job...');
    const testJob = {
      title: `Test Job ${new Date().toISOString()}`,
      company: 'Test Company',
      platform: 'job-monitor',
      location: 'Remote',
      date_posted: new Date().toISOString().split('T')[0],
      application_url: `https://example.com/test-${Date.now()}`,
      description: 'Test job inserted by job-monitor function',
      job_type: 'Full-time',
      is_active: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('jobs')
      .insert([testJob])
      .select();

    if (insertError) {
      console.error('[INSERT] Insert failed:', insertError);
      throw new Error(`Job insertion failed: ${insertError.message}`);
    }

    console.log('[INSERT] Successfully inserted test job:', insertData?.[0]?.id);

    // Verify the job was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('platform', 'job-monitor')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('[VERIFY] Verification result:', {
      count: verifyData?.length || 0,
      error: verifyError?.message || 'none',
      jobs: verifyData?.map(j => ({ id: j.id, title: j.title })) || []
    });

    const response = {
      success: true,
      message: 'Job monitor test completed successfully',
      testJobInserted: !!insertData?.[0],
      testJobId: insertData?.[0]?.id,
      verificationCount: verifyData?.length || 0
    };

    console.log('[SUCCESS] Returning response:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Job monitor function failed:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});