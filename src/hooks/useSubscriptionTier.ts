import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptionTier = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-tier', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'free';

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_tiers (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription tier:', error);
        return 'free';
      }

      return data?.subscription_tiers?.name?.toLowerCase() || 'free';
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};