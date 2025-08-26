import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    console.log('🔧 Starting recovery of stuck book highlight records...');
    
    // Find records stuck in "researching" status for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckRecords, error: findError } = await supabase
      .from('verified_book_highlights')
      .select('id, original_input, user_id, created_at')
      .eq('processing_status', 'researching')
      .lt('created_at', fiveMinutesAgo);

    if (findError) {
      throw findError;
    }

    if (!stuckRecords || stuckRecords.length === 0) {
      console.log('✅ No stuck records found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No stuck records found',
        recovered_count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Found ${stuckRecords.length} stuck records`);

    // Update stuck records to failed status
    const { error: updateError } = await supabase
      .from('verified_book_highlights')
      .update({
        processing_status: 'failed',
        verification_confidence: 'Automatically recovered from stuck processing state',
        updated_at: new Date().toISOString()
      })
      .eq('processing_status', 'researching')
      .lt('created_at', fiveMinutesAgo);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully marked ${stuckRecords.length} stuck records as failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully recovered ${stuckRecords.length} stuck records`,
      recovered_count: stuckRecords.length,
      recovered_records: stuckRecords.map(r => ({
        id: r.id,
        original_input: r.original_input,
        stuck_since: r.created_at
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in recover-stuck-highlights:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});