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
 * - Supabase Database (user_subscriptions, subscription_tiers, user_usage_tracking tables)
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
        message: "No active subscription found. Please subscribe to generate GPT images."
      } as UsageCheckResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current billing period and today's date
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
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
          gpt_images_used: 0,
          image_generations_used: 0,
          dalle_images_used: 0,
          text_generations_used: 0,
          daily_usage_date: today,
          gpt_images_used_today: 0,
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

    // Reset daily counters if it's a new day
    const needsDailyReset = usage.daily_usage_date !== today;
    if (needsDailyReset) {
      console.log(`Resetting daily usage for user ${userId}, was: ${usage.daily_usage_date}, now: ${today}`);
      const { data: resetUsage, error: resetError } = await supabaseClient
        .from('user_usage_tracking')
        .update({
          daily_usage_date: today,
          gpt_images_used_today: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id)
        .select()
        .single();

      if (resetError) {
        console.error('Error resetting daily usage:', resetError);
        throw resetError;
      }
      usage = resetUsage;
    }

    const tier = subscription.tier as any;
    
    // Daily-focused limits: free tier = 5 per day, monthly = daysInMonth * daily
    const isFreeTier = (tier?.price_cents ?? 0) === 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const freeDailyLimit = 5;
    const dailyLimit = isFreeTier ? freeDailyLimit : (tier.max_gpt_images_daily || tier.max_gpt_images || 0);
    const monthlyLimit = isFreeTier ? freeDailyLimit * daysInMonth : (tier.max_gpt_images_monthly || tier.max_gpt_images || 0);
    
    // Get current usage
    const currentMonthlyUsed = usage.gpt_images_used || 0;
    const currentDailyUsed = usage.gpt_images_used_today || 0;

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

    // If allowed, increment both daily and monthly usage
    if (allowed) {
      const { error: updateError } = await supabaseClient
        .from('user_usage_tracking')
        .update({
          gpt_images_used: currentMonthlyUsed + amount,
          gpt_images_used_today: currentDailyUsed + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      if (updateError) {
        console.error('Error updating GPT image usage:', updateError);
        throw updateError;
      }
    }

    // Priority messaging: Daily limit is ALWAYS the primary concern
    let message: string | undefined;
    if (!allowed) {
      if (!dailyAllowed) {
        // Daily limit hit - this is the HARD rule
        message = `Daily limit reached! You can generate ${dailyLimit} image${dailyLimit === 1 ? '' : 's'} per day. Come back tomorrow (resets at midnight).`;
      } else if (!monthlyAllowed) {
        // Monthly limit hit but daily still available
        const monthlyRemaining = Math.max(0, monthlyLimit - currentMonthlyUsed);
        message = `Monthly limit reached! You've used ${currentMonthlyUsed}/${monthlyLimit} images this billing cycle. ${monthlyRemaining} remaining.`;
      }
    }

    // For remaining count, prioritize the more restrictive limit
    const dailyRemaining = Math.max(0, dailyLimit - currentDailyUsed);
    const monthlyRemaining = Math.max(0, monthlyLimit - currentMonthlyUsed);
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