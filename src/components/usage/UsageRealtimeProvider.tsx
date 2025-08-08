/**
 * DEVELOPER NOTES - UsageRealtimeProvider
 * 
 * Lightweight provider for real-time usage updates
 * - Subscribes to api_usage_tracking table changes via UnifiedRealtimeManager
 * - Invalidates QUERY_KEYS.usageSummary cache when usage changes
 * - Only triggers on successful image generations to reduce unnecessary updates
 * - Should be wrapped around components that display usage data
 * 
 * Integration:
 * - Added to App.tsx for global coverage
 * - Works with Navigation, UsageDashboard, and other usage components
 * - Uses onApiUsageUpdate callback from useUnifiedRealtime hook
 */

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