import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json().catch(() => ({}));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`Starting monthly usage aggregation for user: ${userId || 'all users'}...`);

    // Get the target month (previous day's month to handle timezone edge cases)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const targetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const targetMonthString = targetMonth.toISOString().split('T')[0];

    console.log(`Processing aggregations for month: ${targetMonthString}`);

    // Call the refresh function to update aggregates
    const { data: refreshResult, error: refreshError } = await supabaseAdmin
      .rpc('refresh_monthly_aggregates', {
        target_month: targetMonthString,
        target_user_id: userId || null
      });

    if (refreshError) {
      console.error('Error refreshing monthly aggregates:', refreshError);
      throw refreshError;
    }

    console.log(`Successfully processed ${refreshResult} user aggregates`);

    // Also process current month to ensure up-to-date data
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthString = currentMonth.toISOString().split('T')[0];

    if (currentMonthString !== targetMonthString) {
      console.log(`Processing current month: ${currentMonthString}`);
      
      const { data: currentRefreshResult, error: currentRefreshError } = await supabaseAdmin
        .rpc('refresh_monthly_aggregates', {
          target_month: currentMonthString,
          target_user_id: userId || null
        });

      if (currentRefreshError) {
        console.error('Error refreshing current month aggregates:', currentRefreshError);
        throw currentRefreshError;
      }

      console.log(`Successfully processed ${currentRefreshResult} current month aggregates`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monthly aggregation completed successfully for ${userId ? '1 user' : refreshResult + ' users'}`,
        processedUsers: refreshResult,
        targetMonth: targetMonthString
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Monthly aggregation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to aggregate monthly usage',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});