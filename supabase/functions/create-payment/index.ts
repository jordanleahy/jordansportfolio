import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating payment session for $6,750");
    
    // Get the Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found");
      throw new Error("Stripe configuration missing");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get the request body to check for any custom data
    const { customerEmail, customerName } = await req.json().catch(() => ({}));
    
    console.log("Request details:", { customerEmail, customerName });

    // Create a one-time payment session for $6,750
    const session = await stripe.checkout.sessions.create({
      // Support guest checkout
      customer_email: customerEmail || undefined,
      customer_creation: customerEmail ? 'always' : undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: "CoFactorAI Query Innovation Workshop",
              description: "3-week Team Alignment & Design Workshop - Strategic AI-powered design sprint"
            },
            unit_amount: 675000, // $6,750.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cofactor-proposal`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_intent_data: {
        metadata: {
          service: "Query Innovation Workshop",
          amount: "6750.00"
        }
      }
    });

    console.log("Payment session created:", session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create payment session" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});