/**
 * EDGE FUNCTION: Create Subscription
 * 
 * PURPOSE:
 * Creates Stripe checkout sessions for subscription purchases, handling customer creation/retrieval,
 * subscription tier validation, and post-checkout welcome email automation. Integrates billing
 * system with user management and onboarding workflows.
 * 
 * INPUTS:
 * - tier_id: string - UUID of the subscription tier being purchased
 * 
 * OUTPUTS:
 * - Success: { url: string, session_id: string } - Stripe checkout session URL and ID
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - Stripe API (customer management, checkout session creation)
 * - Supabase Database (subscription_tiers table)
 * - User Authentication (Bearer token required)
 * - send-welcome-email Edge Function (post-checkout automation)
 * 
 * USAGE:
 * Called from: Subscription purchase flows, pricing pages, upgrade components
 * Authentication: Required - uses Bearer token to identify user
 * 
 * FLOW:
 * 1. Authenticate user and validate subscription tier
 * 2. Check if Stripe customer exists, create if new user
 * 3. Create Stripe checkout session with tier pricing and metadata
 * 4. Configure success/cancel URLs for post-checkout flow
 * 5. Trigger welcome email function (non-blocking)
 * 6. Return checkout session URL for frontend redirect
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
    const { tier_id } = await req.json();

    if (!tier_id) {
      throw new Error("Subscription tier ID is required");
    }

    // Get subscription tier details
    const { data: tier, error: tierError } = await supabaseClient
      .from('subscription_tiers')
      .select('*')
      .eq('id', tier_id)
      .eq('is_active', true)
      .single();

    if (tierError || !tier) {
      throw new Error("Invalid subscription tier");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tier.name,
            },
            unit_amount: tier.price_cents,
            recurring: { interval: tier.billing_interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscription-cancelled`,
      metadata: {
        tier_id,
        user_id: user.id,
      },
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}, tier ${tier_id}`);

    // Email sending is intentionally disabled here to avoid sending before payment succeeds.
    // Consider sending a welcome/receipt email from a success callback or a verification step.


    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});