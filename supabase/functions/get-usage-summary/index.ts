import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageSummaryResponse {
  isAdmin: boolean;
  adminOverride?: { monthlyLimit: number; dailyLimit: number } | null;
  limits: {
    daily: { limit: number; used: number; remaining: number };
    monthly: { limit: number; used: number; remaining: number };
  };
  totals: { totalCredits: number; usedCredits: number; remainingCredits: number; percentUsed: number };
  period?: { start: string | null; end: string | null };
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin roles are handled via subscription tiers; no explicit override
    const isAdmin = false;
    // No admin override constants; limits come from subscription tiers

    // Fetch active subscription (if not admin)
    let periodStart: string | null = null;
    let periodEnd: string | null = null;
    let monthlyLimit = 0;
    let dailyLimit = 0;
    let tierName = 'free';

    // Fetch active subscription for all users
    const nowIso = new Date().toISOString();
    const { data: subscription, error: subErr } = await supabase
      .from("user_subscriptions")
      .select(`
        tier_id,
        current_period_start,
        current_period_end,
        status,
        subscription_tiers (
          name,
          max_gpt_images,
          max_gpt_images_daily,
          max_gpt_images_monthly
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("current_period_start", nowIso)
      .gte("current_period_end", nowIso)
      .maybeSingle();

    if (subErr) throw subErr;

    periodStart = subscription?.current_period_start ?? null;
    periodEnd = subscription?.current_period_end ?? null;

    // Fetch tier limits
    if (subscription?.tier_id && subscription?.subscription_tiers) {
      const tier = subscription.subscription_tiers as any;
      tierName = tier.name || 'free';
      
      const tierMonthly = (tier?.max_gpt_images_monthly ?? tier?.max_gpt_images ?? 0) as number;
      const tierDaily = (tier?.max_gpt_images_daily ?? Math.ceil((tierMonthly as number) * 0.1)) as number;
      monthlyLimit = tierMonthly;
      dailyLimit = tierDaily;
    } else {
      // No active tier: zero limits
      monthlyLimit = 0;
      dailyLimit = 0;
    }

    // Compute usage - use aggregated data for starter/admin users
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthString = currentMonth.toISOString().split('T')[0];
    const yyyyMmDd = today.toISOString().slice(0, 10);

    let monthlyUsed = 0;

    // For starter/admin users, try to get from monthly aggregates first
    if (['starter', 'admin'].includes(tierName)) {
      const { data: monthlyAggregate, error: aggregateError } = await supabase
        .from('api_usage_monthly_aggregates')
        .select('image_generations')
        .eq('user_id', user.id)
        .eq('month_year', currentMonthString)
        .single();

      if (!aggregateError && monthlyAggregate) {
        monthlyUsed = monthlyAggregate.image_generations;
        console.log(`Using aggregated monthly data: ${monthlyUsed} images for user ${user.id}`);
      } else {
        console.log('No aggregated data found, falling back to real-time count');
        // Fallback to real-time counting
        if (periodStart && periodEnd) {
          const { count, error: monthlyErr } = await supabase
            .from("api_usage_tracking")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("request_type", "image_generation")
            .eq("success", true)
            .gte("created_at", periodStart)
            .lte("created_at", periodEnd);
          if (monthlyErr) throw monthlyErr;
          monthlyUsed = count || 0;
        }
      }
    } else {
      // For free tier users, always use real-time counting
      if (periodStart && periodEnd) {
        const { count, error: monthlyErr } = await supabase
          .from("api_usage_tracking")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("request_type", "image_generation")
          .eq("success", true)
          .gte("created_at", periodStart)
          .lte("created_at", periodEnd);
        if (monthlyErr) throw monthlyErr;
        monthlyUsed = count || 0;
      }
    }

    // Daily usage: count successful image generations for today (always real-time)
    const startOfDay = `${yyyyMmDd}T00:00:00.000Z`;
    const endOfDay = `${yyyyMmDd}T23:59:59.999Z`;
    const { count: dailyCount, error: dailyErr } = await supabase
      .from("api_usage_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("request_type", "image_generation")
      .eq("success", true)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);
    if (dailyErr) throw dailyErr;
    const dailyUsed = dailyCount || 0;

    // Apply limits and compute remaining
    const monthlyRemaining = Math.max(monthlyLimit - monthlyUsed, 0);
    const dailyRemaining = Math.max(dailyLimit - dailyUsed, 0);
    const totalCredits = monthlyLimit;
    const usedCredits = monthlyUsed;
    const remainingCredits = Math.max(totalCredits - usedCredits, 0);
    const percentUsed = totalCredits > 0 ? Math.min((usedCredits / totalCredits) * 100, 100) : 0;

    const payload: UsageSummaryResponse = {
      isAdmin,
      adminOverride: null,
      limits: {
        daily: { limit: dailyLimit, used: dailyUsed, remaining: dailyRemaining },
        monthly: { limit: totalCredits, used: usedCredits, remaining: remainingCredits },
      },
      totals: { totalCredits, usedCredits, remainingCredits, percentUsed },
      period: { start: periodStart, end: periodEnd },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-usage-summary error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
