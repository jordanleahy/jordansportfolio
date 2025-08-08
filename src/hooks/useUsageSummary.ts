import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageLimits {
  daily: { limit: number; used: number; remaining: number };
  monthly: { limit: number; used: number; remaining: number };
}

export interface UsageSummaryData {
  isAdmin: boolean;
  adminOverride?: { monthlyLimit: number; dailyLimit: number } | null;
  limits: UsageLimits;
  totals: { totalCredits: number; usedCredits: number; remainingCredits: number; percentUsed: number };
  period?: { start: string | null; end: string | null };
  timestamp: string;
}

export const useUsageSummary = () => {
  const query = useQuery<UsageSummaryData>({
    queryKey: ["usage-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-usage-summary", {
        body: {},
      });
      if (error) throw error;
      return data as UsageSummaryData;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    totalCredits: query.data?.totals.totalCredits ?? 0,
    usedCredits: query.data?.totals.usedCredits ?? 0,
    remainingCredits: query.data?.totals.remainingCredits ?? 0,
    percentUsed: query.data?.totals.percentUsed ?? 0,
  };
};
