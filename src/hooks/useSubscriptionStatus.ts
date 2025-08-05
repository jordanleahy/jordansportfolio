import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionTier {
  id: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  max_image_generations: number;
  max_dalle_images: number;
  max_text_generations: number;
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
  image_generations_used: number;
  dalle_images_used: number;
  text_generations_used: number;
}

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user subscription with tier details
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

      // Get current billing period usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: usage, error: usageError } = await supabase
        .from('user_usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('billing_period_start', periodStart.toISOString())
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }

      return {
        subscription: subscription as UserSubscription | null,
        usage: usage as UserUsage | null,
        hasActiveSubscription: subscription?.status === 'active',
        isWithinLimits: subscription && usage ? {
          imageGenerations: usage.image_generations_used < (subscription.tier as any).max_image_generations,
          dalleImages: usage.dalle_images_used < (subscription.tier as any).max_dalle_images,
          textGenerations: usage.text_generations_used < (subscription.tier as any).max_text_generations,
        } : null
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