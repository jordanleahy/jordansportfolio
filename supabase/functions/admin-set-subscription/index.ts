import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SetSubscriptionRequest = {
  userId: string;
  tierId: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as SetSubscriptionRequest;
    if (!body?.userId || !body?.tierId) {
      return new Response(JSON.stringify({ error: "userId and tierId are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth check
    const { data: me, error: meErr } = await supabaseUser.auth.getUser();
    if (meErr || !me.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Admin role check
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: me.user.id, _role: 'admin' });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify tier exists and get billing interval and limits
    const { data: tier, error: tierErr } = await supabaseAdmin
      .from('subscription_tiers')
      .select('id, name, billing_interval, max_gpt_images, price_cents')
      .eq('id', body.tierId)
      .maybeSingle();
    if (tierErr) throw tierErr;
    if (!tier) throw new Error('Tier not found');

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEndDate = new Date(now);
    if ((tier.billing_interval || 'month') === 'month') {
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    } else if (tier.billing_interval === 'year') {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
    } else {
      // default 30 days
      periodEndDate.setDate(periodEndDate.getDate() + 30);
    }
    const periodEnd = periodEndDate.toISOString();

    // Upsert user subscription
    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: body.userId,
        tier_id: body.tierId,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('id, user_id, status, current_period_start, current_period_end, tier:subscription_tiers(id, name, billing_interval, max_gpt_images, price_cents)')
      .maybeSingle();
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ subscription: upserted, tier }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[admin-set-subscription] error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
