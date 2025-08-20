import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging system
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[check-subscription:${timestamp}] ${step}`, details ? JSON.stringify(details, null, 2) : '');
};

const logTiming = (label: string, start: number) => {
  const duration = Date.now() - start;
  console.log(`[check-subscription:TIMING] ${label}: ${duration}ms`);
  return duration;
};

const logError = (context: string, error: any, additionalData?: any) => {
  console.error(`[check-subscription:ERROR] ${context}:`, {
    message: error.message || error,
    stack: error.stack,
    additionalData,
    timestamp: new Date().toISOString()
  });
};

const logDbOperation = (operation: string, before: any, after: any) => {
  console.log(`[check-subscription:DB] ${operation}:`, {
    before,
    after,
    timestamp: new Date().toISOString()
  });
};

serve(async (req) => {
  const requestStart = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logStep('REQUEST_START', { requestId, method: req.method, url: req.url });
  
  if (req.method === "OPTIONS") {
    logStep('CORS_PREFLIGHT', { requestId });
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
    logStep('ENV_CHECK', { hasStripeKey: !!STRIPE_SECRET_KEY, hasSupabaseUrl: !!SUPABASE_URL });
    if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY secret");

    const authStart = Date.now();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header");
    logStep('AUTH_HEADER_FOUND', { requestId });

    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userRes.user;
    if (!user?.email) throw new Error("No user or email on token");
    
    logTiming('AUTH_VALIDATION', authStart);
    logStep('USER_AUTHENTICATED', { requestId, userId: user.id, email: user.email });

    const stripeStart = Date.now();
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    logStep('STRIPE_CLIENT_INITIALIZED', { requestId, apiVersion: "2023-10-16" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    logTiming('STRIPE_CUSTOMER_LOOKUP', stripeStart);
    logStep('STRIPE_CUSTOMER_SEARCH', { requestId, email: user.email, found: customers.data.length });
    
    if (customers.data.length === 0) {
      logStep("NO_STRIPE_CUSTOMER", { requestId, email: user.email });
      // Mark unsubscribed (update if exists, else insert)
      const dbStart = Date.now();
      const { data: existing } = await supabaseService
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();
      
      logStep('DB_EXISTING_CHECK', { requestId, found: !!existing, currentStatus: existing?.status });
      
      if (existing) {
        const updatePayload = { status: "canceled", updated_at: new Date().toISOString() };
        logDbOperation('UPDATE_SUBSCRIPTION', existing, updatePayload);
        await supabaseService
          .from("user_subscriptions")
          .update(updatePayload)
          .eq("id", existing.id);
      } else {
        const insertPayload = { user_id: user.id, status: "canceled", created_at: new Date().toISOString() };
        logDbOperation('INSERT_SUBSCRIPTION', null, insertPayload);
        await supabaseService
          .from("user_subscriptions")
          .insert(insertPayload);
      }
      
      logTiming('DB_UNSUBSCRIBE_OPERATION', dbStart);
      logTiming('TOTAL_REQUEST', requestStart);
      
      return new Response(JSON.stringify({ subscribed: false, requestId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('STRIPE_CUSTOMER_FOUND', { requestId, customerId, customerEmail: customers.data[0].email });
    
    const subsStart = Date.now();
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    logTiming('STRIPE_SUBSCRIPTION_LOOKUP', subsStart);
    logStep('STRIPE_SUBSCRIPTION_SEARCH', { requestId, customerId, activeSubscriptions: subs.data.length });

    if (subs.data.length === 0) {
      logStep("NO_ACTIVE_SUBSCRIPTION", { requestId, customerId });
      const dbStart2 = Date.now();
      const { data: existing } = await supabaseService
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();
        
      logStep('DB_EXISTING_CHECK_2', { requestId, found: !!existing, currentStatus: existing?.status });
      
      if (existing) {
        const updatePayload = { status: "canceled", updated_at: new Date().toISOString() };
        logDbOperation('UPDATE_SUBSCRIPTION_2', existing, updatePayload);
        await supabaseService
          .from("user_subscriptions")
          .update(updatePayload)
          .eq("id", existing.id);
      } else {
        const insertPayload = { user_id: user.id, status: "canceled", created_at: new Date().toISOString() };
        logDbOperation('INSERT_SUBSCRIPTION_2', null, insertPayload);
        await supabaseService
          .from("user_subscriptions")
          .insert(insertPayload);
      }
      
      logTiming('DB_NO_SUBSCRIPTION_OPERATION', dbStart2);
      logTiming('TOTAL_REQUEST', requestStart);
      
      return new Response(JSON.stringify({ subscribed: false, requestId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;
    const periodStart = new Date(sub.current_period_start * 1000).toISOString();
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
    
    logStep('STRIPE_SUBSCRIPTION_DETAILS', { 
      requestId, 
      subscriptionId: sub.id,
      priceId,
      status: sub.status,
      periodStart,
      periodEnd,
      customerId: sub.customer
    });

    // Map Stripe price -> internal tier
    const tiersStart = Date.now();
    const { data: tiers, error: tiersErr } = await supabaseService
      .from("subscription_tiers")
      .select("id, stripe_price_id, name, max_gpt_images_daily, max_gpt_images_monthly")
      .eq("is_active", true);
    if (tiersErr) throw tiersErr;
    
    logTiming('DB_TIERS_LOOKUP', tiersStart);
    logStep('DB_TIERS_FOUND', { requestId, tiersCount: tiers?.length, tiers });

    const matchedTier = tiers?.find((t: any) => t.stripe_price_id === priceId);
    logStep('TIER_MATCHING', { 
      requestId, 
      priceId, 
      matchedTier: matchedTier ? {
        id: matchedTier.id,
        name: matchedTier.name,
        stripe_price_id: matchedTier.stripe_price_id
      } : null,
      allTierPriceIds: tiers?.map(t => t.stripe_price_id)
    });

    // Update existing row if present; otherwise insert a new one
    const finalDbStart = Date.now();
    const { data: existingActive } = await supabaseService
      .from("user_subscriptions")
      .select("id, status, tier_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    logStep('DB_FINAL_CHECK', { requestId, existing: existingActive });

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
      logDbOperation('UPDATE_ACTIVE_SUBSCRIPTION', existingActive, payload);
      await supabaseService
        .from("user_subscriptions")
        .update(payload)
        .eq("id", existingActive.id);
      logStep('DB_UPDATE_COMPLETE', { requestId, subscriptionId: existingActive.id });
    } else {
      logDbOperation('INSERT_ACTIVE_SUBSCRIPTION', null, payload);
      await supabaseService
        .from("user_subscriptions")
        .insert(payload);
      logStep('DB_INSERT_COMPLETE', { requestId, payload });
    }

    logTiming('DB_FINAL_OPERATION', finalDbStart);
    logStep("SUBSCRIPTION_SYNC_SUCCESS", { 
      requestId, 
      tier_id: matchedTier?.id, 
      tier_name: matchedTier?.name,
      status: sub.status,
      subscription_id: sub.id
    });

    const totalTime = logTiming('TOTAL_REQUEST', requestStart);
    
    const response = {
      subscribed: true,
      status: sub.status,
      tier_id: matchedTier?.id ?? null,
      tier_name: matchedTier?.name ?? null,
      stripe_subscription_id: sub.id,
      requestId,
      processingTimeMs: totalTime
    };
    
    logStep('SUCCESS_RESPONSE', { requestId, response });
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const totalTime = logTiming('TOTAL_REQUEST_ERROR', requestStart);
    const message = error instanceof Error ? error.message : String(error);
    
    logError('FUNCTION_ERROR', error, { 
      requestId,
      processingTimeMs: totalTime,
      url: req.url,
      method: req.method
    });
    
    return new Response(JSON.stringify({ 
      error: message, 
      requestId,
      processingTimeMs: totalTime
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});