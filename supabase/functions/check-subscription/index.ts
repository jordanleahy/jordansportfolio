import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (msg: string, data?: unknown) => console.log(`[check-subscription] ${msg}`, data ?? "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  // Auth client (to read the user from the JWT)
  const supabaseAuth = createClient(SUPABASE_URL, ANON);
  // Service client (to bypass RLS for writes)
  const supabaseService = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

  try {
    if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY secret");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userRes.user;
    if (!user?.email) throw new Error("No user or email on token");

    log("User", { id: user.id, email: user.email });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    // Find or create by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      log("No Stripe customer found. Marking as unsubscribed.");
      // Mark unsubscribed (update if exists, else insert)
      const { data: existing } = await supabaseService
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        await supabaseService
          .from("user_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabaseService
          .from("user_subscriptions")
          .insert({ user_id: user.id, status: "canceled" });
      }
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });

    if (subs.data.length === 0) {
      log("No active Stripe subscription. Marking as unsubscribed.");
      const { data: existing } = await supabaseService
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        await supabaseService
          .from("user_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabaseService
          .from("user_subscriptions")
          .insert({ user_id: user.id, status: "canceled" });
      }
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;
    const periodStart = new Date(sub.current_period_start * 1000).toISOString();
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Map Stripe price -> internal tier
    const { data: tiers, error: tiersErr } = await supabaseService
      .from("subscription_tiers")
      .select("id, stripe_price_id, name")
      .eq("is_active", true);
    if (tiersErr) throw tiersErr;

    const matchedTier = tiers?.find((t: any) => t.stripe_price_id === priceId);

    // Update existing row if present; otherwise insert a new one
    const { data: existingActive } = await supabaseService
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      tier_id: matchedTier?.id ?? null,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    } as const;

    if (existingActive) {
      await supabaseService
        .from("user_subscriptions")
        .update(payload)
        .eq("id", existingActive.id);
    } else {
      await supabaseService
        .from("user_subscriptions")
        .insert(payload);
    }

    log("Subscription synced", { tier_id: matchedTier?.id, status: sub.status });

    return new Response(
      JSON.stringify({
        subscribed: true,
        status: sub.status,
        tier_id: matchedTier?.id ?? null,
        stripe_subscription_id: sub.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("Error", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
