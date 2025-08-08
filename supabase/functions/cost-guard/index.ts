import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Cost Guard - Prevents expensive operations when daily limits are reached
 * Call this before expensive API operations to check if user has budget remaining
 */

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, estimatedCost, operationType } = await req.json();
    
    if (!userId || !estimatedCost) {
      return new Response(JSON.stringify({ error: "User ID and estimated cost required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Cost guard check: User ${userId}, operation: ${operationType}, estimated cost: $${estimatedCost}`);

    // Check if expensive functions are paused
    const { data: settings } = await supabase
      .from('user_settings')
      .select('expensive_functions_paused, pause_reason')
      .eq('user_id', userId)
      .single();

    if (settings?.expensive_functions_paused) {
      console.log(`Functions paused for user ${userId}: ${settings.pause_reason}`);
      
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'daily_limit_reached',
        message: 'Expensive functions are paused due to daily cost limit. Limit resets at midnight.',
        paused_reason: settings.pause_reason
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate today's spending
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const { data: usageData, error: usageError } = await supabase
      .from('api_usage_tracking')
      .select('estimated_cost')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (usageError) {
      throw new Error(`Failed to fetch usage data: ${usageError.message}`);
    }

    const currentDailyCost = (usageData || []).reduce((sum, record) => {
      return sum + Number(record.estimated_cost || 0);
    }, 0);

    const projectedCost = currentDailyCost + estimatedCost;
    const dailyLimit = 50; // $50 daily limit

    console.log(`Current daily cost: $${currentDailyCost.toFixed(2)}, projected: $${projectedCost.toFixed(2)}`);

    // Check if this operation would exceed the daily limit
    if (projectedCost > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - currentDailyCost);
      
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'would_exceed_limit',
        message: `This operation would exceed your daily limit of $${dailyLimit}. You have $${remaining.toFixed(2)} remaining today.`,
        current_daily_cost: currentDailyCost,
        daily_limit: dailyLimit,
        remaining_budget: remaining,
        estimated_operation_cost: estimatedCost
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Operation is allowed
    return new Response(JSON.stringify({
      allowed: true,
      current_daily_cost: currentDailyCost,
      daily_limit: dailyLimit,
      remaining_budget: dailyLimit - projectedCost,
      estimated_operation_cost: estimatedCost
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in cost guard:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);