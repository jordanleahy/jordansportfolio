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

// Cost computation helpers
function parseImageSizePx(size?: string): number {
  if (!size) return 1024;
  const [w, h] = size.split('x').map((v) => parseInt(v, 10));
  if (isNaN(w) || isNaN(h)) return 1024;
  return Math.max(w, h);
}

function computeImageGenerationCost(size?: string, quality: string = 'standard'): number {
  const px = parseImageSizePx(size);
  // Pricing approximations per image in USD
  // Standard: 512=$0.016, 1024=$0.040, 2048=$0.080
  // High:     512=$0.040, 1024=$0.080, 2048=$0.160
  const standard = px >= 2048 ? 0.08 : px >= 1024 ? 0.04 : 0.016;
  const high = px >= 2048 ? 0.16 : px >= 1024 ? 0.08 : 0.04;
  return (quality === 'high' || quality === 'hd') ? high : standard;
}

const TEXT_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5-2025-08-07': { input: 3.0, output: 12.0 }, // GPT-5 flagship pricing per 1M tokens
  'gpt-5-mini-2025-08-07': { input: 0.15, output: 0.60 }, // GPT-5 mini pricing per 1M tokens
  'gpt-5-nano-2025-08-07': { input: 0.05, output: 0.20 }, // GPT-5 nano pricing per 1M tokens
  'gpt-4o-mini': { input: 0.15, output: 0.60 }, // Legacy model
  'gpt-4o': { input: 5, output: 15 }, // Legacy model
  default: { input: 1.5, output: 6 },
};

function computeTextCost(record: any): number {
  const rates = TEXT_PRICING[record?.model_used] || TEXT_PRICING.default;
  const prompt = Number(record?.prompt_tokens ?? 0);
  const completion = Number(record?.completion_tokens ?? 0);
  const inputCost = (prompt / 1_000_000) * rates.input;
  const outputCost = (completion / 1_000_000) * rates.output;
  const total = inputCost + outputCost;
  return Number.isFinite(total) ? Number(total.toFixed(6)) : 0;
}

function computeActualCost(record: any, imageCostByUsageId: Map<string, number>): number {
  try {
    if (record?.request_type === 'image_generation') {
      const mapped = imageCostByUsageId.get(record.id);
      if (typeof mapped === 'number') return Number(mapped.toFixed(6));
      const computed = computeImageGenerationCost(record?.image_size, record?.image_quality || 'standard');
      return Number(computed.toFixed(6));
    }
    if (record?.request_type === 'text_generation' || record?.request_type === 'image_prompt') {
      const computed = computeTextCost(record);
      if (computed > 0) return computed;
    }
    return Number((record?.estimated_cost || 0).toFixed(6));
  } catch (_e) {
    return Number((record?.estimated_cost || 0).toFixed(6));
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
      // Since the external OpenAI usage/costs APIs are not available,
      // we'll focus on syncing our internal usage data with actual usage patterns
      console.log('Syncing internal OpenAI usage data...');

      // Get our unsynced records from the database
      let usageQuery = supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('openai_synced', false);
      if (syncType !== 'all') {
        usageQuery = usageQuery
          .gte('created_at', new Date(startTimestamp * 1000).toISOString())
          .lte('created_at', new Date(endTimestamp * 1000).toISOString());
      }
      const { data: unsyncedRecords, error: selectError } = await usageQuery
        .order('created_at', { ascending: true });

      if (selectError) {
        console.error('Error selecting unsynced records:', selectError);
        throw new Error(`Failed to fetch unsynced records: ${selectError.message}`);
      }

      console.log(`Found ${unsyncedRecords?.length || 0} unsynced records for date range`);
      
      // Image cost reconciliation map is no longer preloaded from the images table
      // We compute costs directly from api_usage_tracking records
      const imageCostByUsageId = new Map<string, number>();

      if (!unsyncedRecords || unsyncedRecords.length === 0) {
        console.log('No unsynced records found for the specified date range');
        totalRecordsSynced = 0;
        totalCostSynced = 0;
      } else {
        // Mark all unsynced records as synced and calculate totals
        for (const record of unsyncedRecords) {
          try {
            // Reconcile actual cost
            const actualCost = computeActualCost(record, imageCostByUsageId);

            const { error: updateError } = await supabase
              .from('api_usage_tracking')
              .update({
                openai_synced: true,
                sync_status: 'synced',
                actual_cost: actualCost,
                sync_attempted_at: new Date().toISOString(),
              })
              .eq('id', record.id);

            if (updateError) {
              console.error('Error updating record:', updateError);
              errors.push(`Failed to update record ${record.id}: ${updateError.message}`);
            } else {
              totalRecordsSynced++;
              totalCostSynced += actualCost || 0;
              console.log(`Synced record ${record.id}: ${record.function_name}, actual cost: $${actualCost}, est: $${record.estimated_cost}`);
            }
          } catch (error) {
            console.error('Error processing record:', error);
            errors.push(`Failed to process record ${record.id}: ${error.message}`);
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