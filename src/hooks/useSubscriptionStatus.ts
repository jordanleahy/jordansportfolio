import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionTier {
  id: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  max_gpt_images: number;
  stripe_price_id: string;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  tier: SubscriptionTier;
}

export interface UserUsage {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  gpt_images_used: number;
}

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Return default values for unauthenticated users
        return {
          subscription: null,
          usage: null,
          hasActiveSubscription: false,
          isWithinLimits: null
        };
      }

      // Get user subscription with tier details (if any)
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Define current month range
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch per-day usage rows for the month to support "1 per day" logic
      const { data: dailyUsageRows, error: dailyErr } = await supabase
        .from('user_usage_tracking')
        .select('daily_usage_date, gpt_images_used_today')
        .eq('user_id', user.id)
        .gte('daily_usage_date', periodStart.toISOString().slice(0, 10))
        .lte('daily_usage_date', periodEnd.toISOString().slice(0, 10));
      if (dailyErr && dailyErr.code !== 'PGRST116') throw dailyErr;

      // Days used = count of distinct dates in month where at least one free image was generated
      const daysUsed = (dailyUsageRows || [])
        .filter(r => (r as any).gpt_images_used_today && (r as any).gpt_images_used_today > 0)
        .reduce((set, r) => set.add((r as any).daily_usage_date), new Set<string>()).size;

      // Determine tier: if free (price 0 or no subscription), cap is 30 per month; otherwise use tier limit
      const isFreeTier = !subscription || (subscription as any)?.tier?.price_cents === 0;
      const totalCredits = isFreeTier ? 30 : ((subscription as any)?.tier?.max_gpt_images || 0);

      // Compose usage object compatible with existing UI (gpt_images_used represents days used for free tier)
      const usage = {
        gpt_images_used: isFreeTier ? daysUsed : daysUsed, // keep same metric; UI shows remaining based on totalCredits
        billing_period_start: periodStart.toISOString(),
        billing_period_end: periodEnd.toISOString(),
        user_id: user.id,
        id: 'virtual-usage'
      } as any;

      const computedSubscription = subscription
        ? ({
            ...subscription,
            tier: { ...(subscription as any).tier, max_gpt_images: totalCredits }
          } as any)
        : ({
            id: 'free-sub',
            user_id: user.id,
            tier_id: 'free-tier',
            stripe_subscription_id: '',
            stripe_customer_id: '',
            status: 'active',
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            tier: {
              id: 'free-tier',
              name: 'Free Plan',
              price_cents: 0,
              billing_interval: 'month',
              max_gpt_images: totalCredits,
              stripe_price_id: '',
              is_active: true
            }
          } as any);
      return {
        subscription: computedSubscription,
        usage: usage,
        hasActiveSubscription: true,
        isWithinLimits: { gptImages: daysUsed < totalCredits }
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSubscriptionTiers = () => {
  return useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      return data as SubscriptionTier[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};