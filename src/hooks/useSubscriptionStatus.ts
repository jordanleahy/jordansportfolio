import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
export interface SubscriptionTier {
  id: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  max_gpt_images: number;
  max_gpt_images_daily: number;
  max_gpt_images_monthly: number;
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
  const { user } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEYS.subscriptionStatus, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
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

      // Get current month's usage count from api_usage_tracking
      const { count: monthlyUsage, error: usageErr } = await supabase
        .from('api_usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('success', true)
        .in('request_type', ['image_generation', 'gpt_image_generation'])
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());
      if (usageErr && usageErr.code !== 'PGRST116') throw usageErr;

      // Monthly usage count for all tiers
      const monthlyImageUsage = monthlyUsage || 0;

      // Accurate daily usage for free tier: count successful image generations today from api_usage_tracking
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const { count: successCount, error: usageCountErr } = await (supabase as any)
        .from('api_usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('success', true)
        .in('request_type', ['image_generation', 'gpt_image_generation'])
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());
      let imagesUsedToday = 0;
      imagesUsedToday = successCount || 0;

      // Determine tier: if free (price 0 or no subscription), cap is 5 per day; otherwise use tier limit
      const isFreeTier = !subscription || (subscription as any)?.tier?.price_cents === 0;
      const totalCredits = isFreeTier ? 5 : ((subscription as any)?.tier?.max_gpt_images || 0);

      // Compose usage object compatible with existing UI
      const usage = {
        // For free tier, show how many images used today; for paid tiers, show monthly usage
        gpt_images_used: isFreeTier ? imagesUsedToday : monthlyImageUsage,
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
              billing_interval: 'day',
              max_gpt_images: totalCredits,
              stripe_price_id: '',
              is_active: true
            }
          } as any);
      return {
        subscription: computedSubscription,
        usage: usage,
        hasActiveSubscription: true,
        isWithinLimits: { gptImages: (isFreeTier ? imagesUsedToday : monthlyImageUsage) < totalCredits }
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSubscriptionTiers = () => {
  return useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('id, name, price_cents, billing_interval, max_gpt_images, max_gpt_images_daily, max_gpt_images_monthly, stripe_price_id, is_active')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      return data as SubscriptionTier[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};