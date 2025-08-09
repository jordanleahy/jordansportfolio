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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  const supabaseService = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    
    // Get session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Session details:", JSON.stringify(session, null, 2));
    
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      console.log("Price ID from subscription:", priceId);
      
      // Update the Starter tier with the actual price ID
      await supabaseService
        .from("subscription_tiers")
        .update({ stripe_price_id: priceId })
        .eq("name", "Starter");
        
      return new Response(JSON.stringify({ 
        price_id: priceId,
        message: "Updated Starter tier with actual price ID" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ error: "No subscription found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
    
  } catch (error) {
    console.error("Debug error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});