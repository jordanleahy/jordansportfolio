import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CostAlert {
  threshold: number;
  message: string;
  action: 'alert' | 'pause';
}

const COST_THRESHOLDS: CostAlert[] = [
  { threshold: 10, message: "You've spent $10 today", action: 'alert' },
  { threshold: 25, message: "You've spent $25 today - consider slowing down", action: 'alert' },
  { threshold: 40, message: "Critical: $40 spent today!", action: 'alert' },
  { threshold: 50, message: "LIMIT REACHED: $50 daily limit hit - pausing expensive functions", action: 'pause' }
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calculate today's costs
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log(`Monitoring costs for user ${userId} from ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);

    // Get today's API usage
    const { data: usageData, error: usageError } = await supabase
      .from('api_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (usageError) {
      throw new Error(`Failed to fetch usage data: ${usageError.message}`);
    }

    // Calculate total cost and breakdown by function
    let totalCost = 0;
    const functionCosts = new Map<string, { cost: number; requests: number }>();

    for (const record of usageData || []) {
      const cost = Number(record.estimated_cost || 0);
      totalCost += cost;

      const funcName = record.function_name;
      const existing = functionCosts.get(funcName) || { cost: 0, requests: 0 };
      existing.cost += cost;
      existing.requests += 1;
      functionCosts.set(funcName, existing);
    }

    console.log(`Total cost today: $${totalCost.toFixed(2)}`);

    // Get user profile for alerts
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single();

    const userEmail = profile?.email;
    const userName = profile?.full_name;

    // Check if any thresholds are crossed
    const alertsToSend = [];
    let shouldPause = false;

    for (const threshold of COST_THRESHOLDS) {
      if (totalCost >= threshold.threshold) {
        // Check if we've already sent this alert today
        const { data: existingAlert } = await supabase
          .from('cost_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('threshold_amount', threshold.threshold)
          .gte('created_at', todayStart.toISOString())
          .single();

        if (!existingAlert) {
          alertsToSend.push(threshold);
          
          if (threshold.action === 'pause') {
            shouldPause = true;
          }

          // Log the alert
          await supabase.from('cost_alerts').insert({
            user_id: userId,
            threshold_amount: threshold.threshold,
            actual_amount: totalCost,
            alert_type: threshold.action,
            message: threshold.message
          });
        }
      }
    }

    // Send alerts
    for (const alert of alertsToSend) {
      if (userEmail) {
        console.log(`Sending ${alert.action} alert for $${alert.threshold} threshold`);
        
        // Email sending disabled
        // await supabase.functions.invoke('send-usage-alert', {
        //   body: {
        //     userEmail,
        //     userName,
        //     usageType: 'Daily API Costs',
        //     currentUsage: totalCost,
        //     limit: 50, // Daily limit
        //     percentageUsed: (totalCost / 50) * 100,
        //     customMessage: alert.message
        //   }
        // });
      }
    }

    // If we should pause, update user settings
    if (shouldPause) {
      console.log('PAUSING expensive functions due to daily limit reached');
      
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          expensive_functions_paused: true,
          pause_reason: 'daily_cost_limit',
          paused_at: new Date().toISOString()
        });
    }

    // Return detailed cost breakdown
    const topFunctions = Array.from(functionCosts.entries())
      .sort(([,a], [,b]) => b.cost - a.cost)
      .slice(0, 5)
      .map(([name, data]) => ({
        function_name: name,
        cost: data.cost,
        requests: data.requests,
        avg_cost_per_request: data.cost / data.requests
      }));

    return new Response(JSON.stringify({
      success: true,
      total_cost_today: totalCost,
      alerts_sent: alertsToSend.length,
      functions_paused: shouldPause,
      top_expensive_functions: topFunctions,
      cost_breakdown: {
        total_requests: usageData?.length || 0,
        average_cost_per_request: totalCost / (usageData?.length || 1)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error monitoring daily costs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);