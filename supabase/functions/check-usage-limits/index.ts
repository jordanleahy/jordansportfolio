/**
 * EDGE FUNCTION: Check Usage Limits - GPT Image with Daily/Monthly Limits
 * 
 * PURPOSE:
 * Validates and tracks user usage limits against their subscription tier for GPT-image-1 
 * generation. Enforces both daily and monthly limits, preventing users from exceeding 
 * either limit and automatically resetting daily counters each day.
 * 
 * LOGIC:
 * - HARD daily limit (e.g., 1 image per day) - NO catch-up if user skips days
 * - Monthly cap (e.g., 30 images total) - billing cycle limit
 * - Daily limit resets at midnight, monthly resets on billing cycle
 * - Both limits must be respected - daily is ALWAYS enforced regardless of monthly remaining
 * 
 * OUTPUTS:
 * - Success: { allowed: boolean, remaining: number, limit: number, usage_type: string, message?: string }
 * - Error: { error: string, allowed: false, remaining: 0, limit: 0, usage_type: 'unknown' }
 * 
 * DEPENDENCIES:
 * - Supabase Database (user_subscriptions, subscription_tiers, api_usage_tracking tables)
 * - User Authentication (Bearer token required)
 * 
 * USAGE:
 * Called from: Frontend components before making GPT image generation requests
 * Authentication: Required - uses Bearer token to identify user
 * 
 * FLOW:
 * 1. Authenticate user from Bearer token
 * 2. Retrieve user's active subscription and tier limits (daily + monthly)
 * 3. Get or create current billing period usage record with daily tracking
 * 4. Reset daily counters if new day detected
 * 5. Check DAILY limit first (HARD rule) - if exceeded, deny regardless of monthly remaining
 * 6. Check MONTHLY limit second - if exceeded, deny even if daily allowance remains
 * 7. If both limits allow, increment both daily and monthly usage counters
 * 8. If denied, return specific message about which limit was hit
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

interface UsageCheckRequest {
  usage_type: 'gpt_image_generation';
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
  console.log(`[check-usage-limits] Function started, method: ${req.method}`);
  
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

    console.log(`Checking GPT image usage limits for user ${userId}, amount: ${amount}`);

    // Validate usage type
    if (usage_type !== 'gpt_image_generation') {
      throw new Error(`Invalid usage type: ${usage_type}. Only 'gpt_image_generation' is supported.`);
    }

    // Handle role-based tier assignment for admin and regular users
    let userRole = null;
    try {
      const { data: roleRow } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      userRole = roleRow?.role;
    } catch (_e) {
      // ignore if user_roles doesn't exist or no role assigned
      userRole = null;
    }

    // Auto-assign tiers based on user roles
    if (userRole === 'admin') {
      console.log(`🔑 Admin user detected, ensuring Admin tier assignment`);
      // Find Admin tier (created via migration), fallback to dynamic limits if missing
      const { data: adminTier } = await supabaseClient
        .from('subscription_tiers')
        .select('*')
        .eq('name', 'Admin')
        .limit(1)
        .single();

      // Upsert user_subscriptions to point to Admin tier
      if (adminTier?.id) {
        const { data: existingSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingSub) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              tier_id: adminTier.id,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id);
        } else {
          await supabaseClient
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier_id: adminTier.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: null,
            });
        }
      }
    } else if (userRole === 'user') {
      console.log(`👤 Regular user detected, ensuring Free Plan tier assignment`);
      // Find Free Plan tier
      const { data: freeTier } = await supabaseClient
        .from('subscription_tiers')
        .select('*')
        .eq('name', 'Free Plan')
        .eq('price_cents', 0)
        .limit(1)
        .single();

      // Upsert user_subscriptions to point to Free Plan tier
      if (freeTier?.id) {
        const { data: existingSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingSub) {
          // Only update if not already on a paid tier
          if (existingSub.tier_id !== freeTier.id) {
            const { data: currentTier } = await supabaseClient
              .from('subscription_tiers')
              .select('price_cents')
              .eq('id', existingSub.tier_id)
              .single();
            
            // Only auto-assign Free Plan if current tier is also free (price_cents = 0)
            if (currentTier?.price_cents === 0) {
              await supabaseClient
                .from('user_subscriptions')
                .update({
                  tier_id: freeTier.id,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingSub.id);
            }
          }
        } else {
          await supabaseClient
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier_id: freeTier.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: null,
            });
        }
      }
    }

    // Get user subscription (after potential admin auto-assignment)
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
        message: "No active subscription found. Please subscribe to generate GPT images."
      } as UsageCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current usage directly from api_usage_tracking table
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get subscription billing period
    const billingStart = subscription.current_period_start ? new Date(subscription.current_period_start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const billingEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const tier = subscription.tier as any;

    // Get daily and monthly limits directly from tier (all users now have proper tier assignments)
    const dailyLimit = tier?.max_gpt_images_daily || 0;
    const monthlyLimit = tier?.max_gpt_images_monthly || 0;
    
    // Count current usage from api_usage_tracking
    // Monthly usage: count successful image generations within billing period
    const { count: monthlyCount, error: monthlyError } = await supabaseClient
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_type', 'image_generation')
      .eq('success', true)
      .gte('created_at', billingStart.toISOString())
      .lte('created_at', billingEnd.toISOString());
    
    if (monthlyError) throw monthlyError;
    const currentMonthlyUsed = monthlyCount || 0;

    // Daily usage: count successful image generations for today
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;
    const { count: dailyCount, error: dailyError } = await supabaseClient
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('request_type', 'image_generation')
      .eq('success', true)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);
    
    if (dailyError) throw dailyError;
    const currentDailyUsed = dailyCount || 0;

    // Calculate remaining for both limits
    const monthlyRemaining = Math.max(0, monthlyLimit - currentMonthlyUsed);
    const dailyRemaining = Math.max(0, dailyLimit - currentDailyUsed);

    // HARD RULE: Check daily limit FIRST - no exceptions
    const dailyAllowed = currentDailyUsed + amount <= dailyLimit;
    
    // Only check monthly if daily allows (daily is HARD rule)
    const monthlyAllowed = currentMonthlyUsed + amount <= monthlyLimit;
    
    // Both limits must pass - daily is NON-NEGOTIABLE
    const allowed = dailyAllowed && monthlyAllowed;

    console.log(`GPT Image usage check for user ${userId}:`);
    console.log(`  Daily HARD LIMIT: ${currentDailyUsed}/${dailyLimit}, requesting: ${amount}, allowed: ${dailyAllowed}`);
    console.log(`  Monthly Limit: ${currentMonthlyUsed}/${monthlyLimit}, requesting: ${amount}, allowed: ${monthlyAllowed}`);
    console.log(`  Overall allowed: ${allowed}`);

    // Usage is now tracked automatically in api_usage_tracking by the image generation functions
    // No need to manually increment counters here - the tracking happens during actual usage

    // Priority messaging: Daily limit is ALWAYS the primary concern
    let message: string | undefined;
    if (!allowed) {
      if (!dailyAllowed) {
        // Daily limit hit - this is the HARD rule
        message = `Daily limit reached! You can generate ${dailyLimit} image${dailyLimit === 1 ? '' : 's'} per day. Come back tomorrow (resets at midnight).`;
      } else if (!monthlyAllowed) {
        // Monthly limit hit but daily still available
        const monthlyRemainingNow = Math.max(0, monthlyLimit - currentMonthlyUsed);
        message = `Monthly limit reached! You've used ${currentMonthlyUsed}/${monthlyLimit} images this billing cycle. ${monthlyRemainingNow} remaining.`;
      }
    }

    // For remaining count, prioritize the more restrictive limit
    const restrictiveRemaining = Math.min(dailyRemaining, monthlyRemaining);

    const response: UsageCheckResponse = {
      allowed,
      remaining: allowed ? restrictiveRemaining - amount : restrictiveRemaining,
      limit: dailyLimit, // Always show daily limit since it's the hard rule
      usage_type,
      message
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