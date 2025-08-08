import React from "react";
import { useUnifiedRealtime } from "@/hooks/useUnifiedRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface UsageRealtimeProviderProps {
  children: React.ReactNode;
}

export const UsageRealtimeProvider: React.FC<UsageRealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for api_usage_tracking changes
  useUnifiedRealtime({
    enabled: !!user?.id,
    userId: user?.id,
    onApiUsageUpdate: () => {
      // Invalidate usage summary when API usage changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usageSummary });
    },
  });

  return <>{children}</>;
};