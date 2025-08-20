import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface UsageLimits {
  daily: { limit: number; used: number; remaining: number };
  monthly: { limit: number; used: number; remaining: number };
}

export interface UsageSummaryData {
  isAdmin: boolean;
  adminOverride?: { monthlyLimit: number; dailyLimit: number } | null;
  subscriptionTier: string;
  limits: UsageLimits;
  totals: { totalCredits: number; usedCredits: number; remainingCredits: number; percentUsed: number };
  period?: { start: string | null; end: string | null };
  timestamp: string;
}

const DEFAULTS: UsageSummaryData = {
  isAdmin: false,
  adminOverride: null,
  subscriptionTier: 'free',
  limits: { daily: { limit: 0, used: 0, remaining: 0 }, monthly: { limit: 0, used: 0, remaining: 0 } },
  totals: { totalCredits: 0, usedCredits: 0, remainingCredits: 0, percentUsed: 0 },
  period: { start: null, end: null },
  timestamp: new Date().toISOString(),
};

export const useUsageSummary = () => {
  const { user } = useAuth();

  const query = useQuery<UsageSummaryData>({
    queryKey: QUERY_KEYS.usageSummary,
    queryFn: async () => {
      const queryStart = Date.now();
      console.log('[useUsageSummary] Starting usage summary fetch', { 
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (!user?.id) {
        console.log('[useUsageSummary] No user ID, returning defaults');
        return DEFAULTS;
      }

      try {
        // Get user subscription and tier details
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            tier:subscription_tiers(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const tier = subscription?.tier;
        const subscriptionTier = tier?.name?.toLowerCase() || 'free';
        
        console.log('[useUsageSummary] Subscription data fetched', {
          userId: user.id,
          hasSubscription: !!subscription,
          tier: tier ? {
            id: tier.id,
            name: tier.name,
            daily_limit: tier.max_gpt_images_daily,
            monthly_limit: tier.max_gpt_images_monthly
          } : null,
          subscriptionTier,
          timestamp: new Date().toISOString()
        });
        
        // Get usage limits from subscription tier - use Free Plan defaults if no tier assigned
        const monthlyLimit = tier?.max_gpt_images_monthly ?? 30; // Default to Free Plan monthly limit
        const dailyLimit = tier?.max_gpt_images_daily ?? 3; // Default to Free Plan daily limit

        // Calculate date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Query monthly usage
        const { data: monthlyUsage, error: monthlyError } = await supabase
          .from('api_usage_tracking')
          .select('estimated_cost, success')
          .eq('user_id', user.id)
          .eq('request_type', 'gpt_image_generation')
          .gte('created_at', startOfMonth.toISOString())
          .eq('success', true);

        if (monthlyError) throw monthlyError;

        // Query daily usage  
        const { data: dailyUsage, error: dailyError } = await supabase
          .from('api_usage_tracking')
          .select('estimated_cost, success')
          .eq('user_id', user.id)
          .eq('request_type', 'gpt_image_generation')
          .gte('created_at', startOfDay.toISOString())
          .eq('success', true);

        if (dailyError) throw dailyError;

        // Calculate usage counts
        const monthlyUsed = monthlyUsage?.length || 0;
        const dailyUsed = dailyUsage?.length || 0;
        
        const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
        const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

        console.log('[useUsageSummary] Usage calculations', {
          userId: user.id,
          limits: { dailyLimit, monthlyLimit },
          usage: { dailyUsed, monthlyUsed },
          remaining: { dailyRemaining, monthlyRemaining },
          timestamp: new Date().toISOString()
        });

        // Calculate totals
        const totalCredits = monthlyLimit;
        const usedCredits = monthlyUsed;
        const remainingCredits = monthlyRemaining;
        const percentUsed = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

        const result: UsageSummaryData = {
          isAdmin: false, // Could check roles if needed
          adminOverride: null,
          subscriptionTier,
          limits: {
            daily: {
              limit: dailyLimit,
              used: dailyUsed,
              remaining: dailyRemaining,
            },
            monthly: {
              limit: monthlyLimit,
              used: monthlyUsed,
              remaining: monthlyRemaining,
            },
          },
          totals: {
            totalCredits,
            usedCredits,
            remainingCredits,
            percentUsed,
          },
          period: {
            start: startOfMonth.toISOString(),
            end: null,
          },
          timestamp: new Date().toISOString(),
        };

        const queryTime = Date.now() - queryStart;
        console.log('[useUsageSummary] Query completed successfully', {
          userId: user.id,
          queryTimeMs: queryTime,
          result: {
            subscriptionTier: result.subscriptionTier,
            totalCredits: result.totals.totalCredits,
            usedCredits: result.totals.usedCredits,
            remainingCredits: result.totals.remainingCredits
          },
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (err: any) {
        const queryTime = Date.now() - queryStart;
        console.error('[useUsageSummary] Query error', {
          userId: user.id,
          queryTimeMs: queryTime,
          error: err.message || err,
          timestamp: new Date().toISOString()
        });
        return DEFAULTS;
      }
    },
    staleTime: 5 * 1000, // 5 seconds - much more responsive
    refetchOnWindowFocus: true,
    enabled: !!user?.id,
  });

  // Set up real-time subscription for immediate updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('usage-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_usage_tracking',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useUsageSummary] Real-time usage update received', {
            userId: user.id,
            payload: payload.new,
            timestamp: new Date().toISOString()
          });
          // Immediately refetch when new usage is recorded
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, query.refetch]);

  return {
    ...query,
    data: query.data ?? DEFAULTS,
    totalCredits: query.data?.totals.totalCredits ?? 0,
    usedCredits: query.data?.totals.usedCredits ?? 0,
    remainingCredits: query.data?.totals.remainingCredits ?? 0,
    percentUsed: query.data?.totals.percentUsed ?? 0,
    subscriptionTier: query.data?.subscriptionTier ?? 'free',
  };
};
