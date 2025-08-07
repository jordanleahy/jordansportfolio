/**
 * EDGE FUNCTION: Check Usage Limits
 * 
 * PURPOSE:
 * Validates and tracks user usage limits against their subscription tier for various services 
 * like image generation, DALL-E images, and text generation. Prevents users from exceeding 
 * their monthly allowances and increments usage counters when requests are approved.
 * 
 * INPUTS:
 * - usage_type: string ('image_generation' | 'dalle_image' | 'text_generation') - Type of service being requested
 * - amount: number (optional, default: 1) - Number of units being requested
 * 
 * OUTPUTS:
 * - Success: { allowed: boolean, remaining: number, limit: number, usage_type: string, message?: string }
 * - Error: { error: string, allowed: false, remaining: 0, limit: 0, usage_type: 'unknown' }
 * 
 * DEPENDENCIES:
 * - Supabase Database (user_subscriptions, subscription_tiers, user_usage_tracking tables)
 * - User Authentication (Bearer token required)
 * 
 * USAGE:
 * Called from: Frontend components before making generation requests (stories, images, etc.)
 * Authentication: Required - uses Bearer token to identify user
 * 
 * FLOW:
 * 1. Authenticate user from Bearer token
 * 2. Retrieve user's active subscription and tier limits
 * 3. Get or create current billing period usage record
 * 4. Check if requested amount would exceed tier limits
 * 5. If allowed, increment usage counter and return approval
 * 6. If denied, return remaining allowance and limits
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageCheckRequest {
  usage_type: 'image_generation' | 'dalle_image' | 'text_generation';
  amount?: number;
}

interface UsageCheckResponse {
  allowed: boolean;
  remaining: number;
  limit: number;
  usage_type: string;
  message?: string;
}

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

    const userId = userData.user.id;
    const { usage_type, amount = 1 }: UsageCheckRequest = await req.json();

    console.log(`Checking usage limits for user ${userId}, type: ${usage_type}, amount: ${amount}`);

    // Get user subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.log(`No active subscription found for user ${userId}`);
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        limit: 0,
        usage_type,
        message: "No active subscription found. Please subscribe to continue."
      } as UsageCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get or create current usage record
    let { data: usage, error: usageError } = await supabaseClient
      .from('user_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_period_start', periodStart.toISOString().split('T')[0])
      .single();

    if (usageError && usageError.code === 'PGRST116') {
      // Create new usage record for this billing period
      const { data: newUsage, error: createError } = await supabaseClient
        .from('user_usage_tracking')
        .insert({
          user_id: userId,
          billing_period_start: periodStart.toISOString(),
          billing_period_end: periodEnd.toISOString(),
          image_generations_used: 0,
          dalle_images_used: 0,
          text_generations_used: 0,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      usage = newUsage;
    } else if (usageError) {
      throw usageError;
    }

    const tier = subscription.tier as any;
    let currentUsed = 0;
    let limit = 0;
    let columnName = '';

    // Determine usage limits based on type
    switch (usage_type) {
      case 'image_generation':
        currentUsed = usage.image_generations_used;
        limit = tier.max_image_generations;
        columnName = 'image_generations_used';
        break;
      case 'dalle_image':
        currentUsed = usage.dalle_images_used;
        limit = tier.max_dalle_images;
        columnName = 'dalle_images_used';
        break;
      case 'text_generation':
        currentUsed = usage.text_generations_used;
        limit = tier.max_text_generations;
        columnName = 'text_generations_used';
        break;
      default:
        throw new Error(`Invalid usage type: ${usage_type}`);
    }

    const remaining = Math.max(0, limit - currentUsed);
    const allowed = currentUsed + amount <= limit;

    console.log(`Usage check: ${usage_type}, current: ${currentUsed}, limit: ${limit}, requesting: ${amount}, allowed: ${allowed}`);

    // If allowed, increment the usage
    if (allowed) {
      const { error: updateError } = await supabaseClient
        .from('user_usage_tracking')
        .update({
          [columnName]: currentUsed + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      if (updateError) {
        console.error('Error updating usage:', updateError);
        throw updateError;
      }
    }

    const response: UsageCheckResponse = {
      allowed,
      remaining: allowed ? remaining - amount : remaining,
      limit,
      usage_type,
      message: allowed ? undefined : `Usage limit exceeded for ${usage_type}. ${remaining} remaining this billing cycle.`
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in check-usage-limits:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      allowed: false,
      remaining: 0,
      limit: 0,
      usage_type: 'unknown'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});