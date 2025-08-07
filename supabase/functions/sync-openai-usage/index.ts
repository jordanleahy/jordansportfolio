import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenAIUsageResponse {
  data: Array<{
    timestamp: number;
    n_requests: number;
    operation: string;
    snapshot_id: string;
    n_context_tokens_total: number;
    n_generated_tokens_total: number;
  }>;
}

interface OpenAICostResponse {
  data: Array<{
    timestamp: number;
    cost_in_major: number;
    operation: string;
  }>;
}

async function trackApiUsage(
  supabase: any,
  userId: string | null,
  functionName: string,
  success: boolean,
  cost: number,
  errorMessage?: string,
  processingTimeMs?: number
) {
  try {
    await supabase.from('api_usage_tracking').insert({
      user_id: userId,
      function_name: functionName,
      model_used: 'openai-usage-sync',
      request_type: 'text_generation',
      estimated_cost: cost,
      success,
      error_message: errorMessage,
      response_time_ms: processingTimeMs,
      tokens_used: 0,
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('OpenAI API Key exists:', !!openaiApiKey);
    console.log('OpenAI API Key length:', openaiApiKey?.length);
    console.log('OpenAI API Key starts with sk-:', openaiApiKey?.startsWith('sk-'));

    if (!openaiApiKey) {
      const errorMsg = 'OPENAI_API_KEY environment variable is required';
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user (if authenticated)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    const { syncType = 'daily', date = new Date().toISOString().split('T')[0] } = await req.json().catch(() => ({}));

    console.log(`Starting OpenAI usage sync for ${syncType} on ${date}`);

    // Calculate date range for sync
    const syncDate = new Date(date);
    const startTimestamp = Math.floor(syncDate.getTime() / 1000);
    const endTimestamp = Math.floor((syncDate.getTime() + 24 * 60 * 60 * 1000) / 1000);

    let totalRecordsSynced = 0;
    let totalCostSynced = 0;
    const errors: string[] = [];

    try {
      // Fetch OpenAI usage data - using the correct date parameter
      const dateString = syncDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log(`Fetching usage data for date: ${dateString}`);
      const usageUrl = `https://api.openai.com/v1/usage?date=${dateString}`;
      console.log('Usage URL:', usageUrl);
      
      const usageResponse = await fetch(usageUrl, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Usage response status:', usageResponse.status);
      console.log('Usage response headers:', Object.fromEntries(usageResponse.headers.entries()));

      if (!usageResponse.ok) {
        const errorText = await usageResponse.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI usage API error: ${usageResponse.status} - ${errorText}`);
      }

      const usageData = await usageResponse.json();
      console.log(`Fetched usage data:`, JSON.stringify(usageData, null, 2));

      // Fetch OpenAI costs data
      console.log('Fetching costs data...');
      const costsUrl = `https://api.openai.com/v1/costs?start_time=${startTimestamp}&end_time=${endTimestamp}&bucket_width=1h`;
      console.log('Costs URL:', costsUrl);

      const costsResponse = await fetch(costsUrl, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!costsResponse.ok) {
        throw new Error(`OpenAI costs API error: ${costsResponse.status}`);
      }

      const costsData: OpenAICostResponse = await costsResponse.json();
      console.log(`Fetched ${costsData.data.length} cost records`);

      // Create cost lookup map
      const costMap = costsData.data.reduce((acc, cost) => {
        const key = `${cost.timestamp}_${cost.operation}`;
        acc[key] = cost.cost_in_major;
        return acc;
      }, {} as Record<string, number>);

      // Process usage data and sync with our database
      for (const bucket of usageData.data || []) {
        for (const result of bucket.results || []) {
          try {
          const costKey = `${bucket.start_time}_general`;
          const actualCost = 0; // Will be calculated from cost data

          // Try to find matching records in our database to update
          const { data: existingRecords, error: selectError } = await supabase
            .from('api_usage_tracking')
            .select('id, estimated_cost')
            .gte('created_at', new Date(bucket.start_time * 1000).toISOString())
            .lte('created_at', new Date(bucket.end_time * 1000).toISOString())
            .eq('openai_synced', false);

          if (selectError) {
            console.error('Error selecting existing records:', selectError);
            errors.push(`Failed to select records for timestamp ${bucket.start_time}`);
            continue;
          }

          // Update existing records with OpenAI data
          if (existingRecords && existingRecords.length > 0) {
            for (const record of existingRecords.slice(0, result.num_model_requests || 1)) {
              const { error: updateError } = await supabase
                .from('api_usage_tracking')
                .update({
                  openai_request_id: `bucket_${bucket.start_time}`,
                  openai_synced: true,
                  actual_cost: actualCost / (result.num_model_requests || 1),
                  openai_timestamp: new Date(bucket.start_time * 1000).toISOString(),
                  sync_status: 'synced',
                  total_tokens: (result.input_tokens || 0) + (result.output_tokens || 0),
                  prompt_tokens: result.input_tokens || 0,
                  completion_tokens: result.output_tokens || 0,
                })
                .eq('id', record.id);

              if (updateError) {
                console.error('Error updating record:', updateError);
                errors.push(`Failed to update record ${record.id}`);
              } else {
                totalRecordsSynced++;
                totalCostSynced += actualCost / (result.num_model_requests || 1);
              }
            }
          } else {
            // Create new record if no matching internal record found
            const { error: insertError } = await supabase
              .from('api_usage_tracking')
              .insert({
                user_id: null, // Will need better attribution in production
                function_name: 'openai-direct-api',
                model_used: result.model || 'unknown',
                request_type: 'text_generation',
                estimated_cost: actualCost,
                actual_cost: actualCost,
                success: true,
                tokens_used: (result.input_tokens || 0) + (result.output_tokens || 0),
                prompt_tokens: result.input_tokens || 0,
                completion_tokens: result.output_tokens || 0,
                total_tokens: (result.input_tokens || 0) + (result.output_tokens || 0),
                created_at: new Date(bucket.start_time * 1000).toISOString(),
                openai_request_id: `bucket_${bucket.start_time}`,
                openai_synced: true,
                openai_timestamp: new Date(bucket.start_time * 1000).toISOString(),
                sync_status: 'synced',
              });

            if (insertError) {
              console.error('Error inserting new record:', insertError);
              errors.push(`Failed to insert record for timestamp ${bucket.start_time}`);
            } else {
              totalRecordsSynced++;
              totalCostSynced += actualCost;
            }
          }
        } catch (error) {
          console.error('Error processing usage record:', error);
          errors.push(`Failed to process usage record: ${error.message}`);
        }
      }
      }

      // Log sync operation
      const { error: logError } = await supabase
        .from('openai_usage_sync_logs')
        .insert({
          sync_date: syncDate.toISOString().split('T')[0],
          records_synced: totalRecordsSynced,
          total_cost_synced: totalCostSynced,
          sync_status: errors.length > 0 ? 'partial_success' : 'success',
          error_details: errors.length > 0 ? { errors } : null,
          sync_type: syncType,
        });

      if (logError) {
        console.error('Error logging sync operation:', logError);
      }

    } catch (error) {
      console.error('Error during OpenAI sync:', error);
      errors.push(`Sync failed: ${error.message}`);

      // Log failed sync
      await supabase
        .from('openai_usage_sync_logs')
        .insert({
          sync_date: syncDate.toISOString().split('T')[0],
          records_synced: 0,
          total_cost_synced: 0,
          sync_status: 'failed',
          error_details: { errors },
          sync_type: syncType,
        });
    }

    const processingTime = Date.now() - startTime;

    // Track this API usage
    await trackApiUsage(
      supabase,
      userId,
      'sync-openai-usage',
      errors.length === 0,
      0.001, // Minimal cost for sync operation
      errors.length > 0 ? errors.join('; ') : undefined,
      processingTime
    );

    console.log(`Sync completed: ${totalRecordsSynced} records synced, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: totalRecordsSynced,
        total_cost_synced: totalCostSynced,
        errors: errors.length > 0 ? errors : undefined,
        processing_time_ms: processingTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in sync-openai-usage:', error);
    
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});