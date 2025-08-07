/**
 * EDGE FUNCTION: Manage Subscription
 * 
 * PURPOSE:
 * Creates Stripe billing portal sessions for existing customers to manage their subscriptions.
 * Enables users to view invoices, update payment methods, cancel subscriptions, and manage
 * billing preferences through Stripe's hosted customer portal interface.
 * 
 * INPUTS:
 * - No direct inputs (uses authenticated user context)
 * 
 * OUTPUTS:
 * - Success: { url: string } - Stripe customer portal URL for subscription management
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - Stripe API (billing portal session creation)
 * - Supabase Database (user_subscriptions table)
 * - User Authentication (Bearer token required)
 * 
 * USAGE:
 * Called from: Account settings pages, subscription management components, billing interfaces
 * Authentication: Required - uses Bearer token to identify user and retrieve subscription
 * 
 * FLOW:
 * 1. Authenticate user from Bearer token
 * 2. Retrieve user's active subscription and Stripe customer ID
 * 3. Create Stripe billing portal session for customer
 * 4. Configure return URL to redirect back to dashboard
 * 5. Return portal URL for frontend redirect to Stripe-hosted interface
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      throw new Error("No active subscription found");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.get("origin")}/dashboard`,
    });

    console.log(`Created portal session for user ${user.id}`);

    return new Response(JSON.stringify({ 
      url: portalSession.url
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in manage-subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});