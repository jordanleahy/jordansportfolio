import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useAuth } from "@/contexts/AuthContext";

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
      try {
        const { data, error } = await supabase.functions.invoke("get-usage-summary", { body: {} });
        if (error) throw error;
        return (data as UsageSummaryData) ?? DEFAULTS;
      } catch (err: any) {
        // Gracefully handle unauthorized or missing session
        const msg = err?.message?.toLowerCase?.() || '';
        if (msg.includes('unauthorized') || msg.includes('401')) return DEFAULTS;
        throw err;
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.id, // only fetch when authenticated
  });

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
