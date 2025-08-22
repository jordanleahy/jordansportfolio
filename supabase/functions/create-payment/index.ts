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
    const { paymentType } = await req.json();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Set amount based on payment type
    let amount = 675000; // $6,750 in cents (50% downpayment)
    let productName = "50% Downpayment - Query Innovation Workshop";
    
    if (paymentType === "full") {
      amount = 1350000; // $13,500 in cents (full payment)
      productName = "Full Payment - Query Innovation Workshop";
    }

    // Create a one-time payment session for guest checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: undefined, // Allow guest checkout
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productName,
              description: "Team Alignment & Design Workshop - 3 week strategic AI-powered design sprint"
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cofactor-proposal`,
      allow_promotion_codes: true,
    });

    console.log(`Created payment session for ${productName}: $${amount/100}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});