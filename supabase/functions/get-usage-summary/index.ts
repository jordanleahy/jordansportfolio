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

    // Check admin role via RPC if available
    let isAdmin = false;
    try {
      const { data: hasRole, error: roleErr } = await supabase.rpc("has_role", {
        user_id: user.id,
        role: "admin",
      });
      if (!roleErr && hasRole === true) isAdmin = true;
    } catch (_) {
      // Fallback: not admin
    }

    // Admin override
    const ADMIN_MONTHLY_LIMIT = 10000;
    const ADMIN_DAILY_LIMIT = 10000;

    // Fetch active subscription (if not admin)
    let periodStart: string | null = null;
    let periodEnd: string | null = null;
    let monthlyLimit = ADMIN_MONTHLY_LIMIT;
    let dailyLimit = ADMIN_DAILY_LIMIT;

    if (!isAdmin) {
      const nowIso = new Date().toISOString();
      const { data: subscription, error: subErr } = await supabase
        .from("user_subscriptions")
        .select("tier_id,current_period_start,current_period_end,status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .lte("current_period_start", nowIso)
        .gte("current_period_end", nowIso)
        .maybeSingle();

      if (subErr) throw subErr;

      periodStart = subscription?.current_period_start ?? null;
      periodEnd = subscription?.current_period_end ?? null;

      // Fetch tier limits
      if (subscription?.tier_id) {
        const { data: tier, error: tierErr } = await supabase
          .from("subscription_tiers")
          .select("max_gpt_images, max_gpt_images_daily, max_gpt_images_monthly")
          .eq("id", subscription.tier_id)
          .maybeSingle();
        if (tierErr) throw tierErr;

        const tierMonthly = (tier?.max_gpt_images_monthly ?? tier?.max_gpt_images ?? 0) as number;
        const tierDaily = (tier?.max_gpt_images_daily ?? Math.ceil(tierMonthly * 0.1)) as number;
        monthlyLimit = tierMonthly;
        dailyLimit = tierDaily;
      } else {
        // No active tier: zero limits
        monthlyLimit = 0;
        dailyLimit = 0;
      }
    } else {
      // For admins, set fake period to current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodStart = start.toISOString();
      periodEnd = end.toISOString();
    }

    // Compute usage
    const today = new Date();
    const yyyyMmDd = today.toISOString().slice(0, 10);

    // Monthly usage: sum rows where now is within billing period
    let monthlyUsed = 0;
    let dailyUsed = 0;

    const { data: monthlyRows, error: monthlyErr } = await supabase
      .from("user_usage_tracking")
      .select("gpt_images_used,billing_period_start,billing_period_end")
      .eq("user_id", user.id);
    if (monthlyErr) throw monthlyErr;

    for (const row of monthlyRows ?? []) {
      const start = row.billing_period_start ? new Date(row.billing_period_start) : null;
      const end = row.billing_period_end ? new Date(row.billing_period_end) : null;
      if (start && end && start <= today && today <= end) {
        monthlyUsed += Number(row.gpt_images_used || 0);
      }
    }

    // Daily usage: sum rows for today
    const { data: dailyRows, error: dailyErr } = await supabase
      .from("user_usage_tracking")
      .select("gpt_images_used_today,daily_usage_date")
      .eq("user_id", user.id)
      .eq("daily_usage_date", yyyyMmDd);
    if (dailyErr) throw dailyErr;
    for (const row of dailyRows ?? []) {
      dailyUsed += Number(row.gpt_images_used_today || 0);
    }

    // Apply limits and compute remaining
    const monthlyRemaining = Math.max((isAdmin ? ADMIN_MONTHLY_LIMIT : monthlyLimit) - monthlyUsed, 0);
    const dailyRemaining = Math.max((isAdmin ? ADMIN_DAILY_LIMIT : dailyLimit) - dailyUsed, 0);
    const totalCredits = isAdmin ? ADMIN_MONTHLY_LIMIT : monthlyLimit;
    const usedCredits = monthlyUsed;
    const remainingCredits = Math.max(totalCredits - usedCredits, 0);
    const percentUsed = totalCredits > 0 ? Math.min((usedCredits / totalCredits) * 100, 100) : 0;

    const payload: UsageSummaryResponse = {
      isAdmin,
      adminOverride: isAdmin ? { monthlyLimit: ADMIN_MONTHLY_LIMIT, dailyLimit: ADMIN_DAILY_LIMIT } : null,
      limits: {
        daily: { limit: isAdmin ? ADMIN_DAILY_LIMIT : dailyLimit, used: dailyUsed, remaining: dailyRemaining },
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
