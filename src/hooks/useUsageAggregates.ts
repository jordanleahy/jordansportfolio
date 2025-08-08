import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UsageChartData, UsageFilters } from "@/types/apiUsage";
import { addDays, format } from "date-fns";

function toDateString(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function useAggregatedChartData(filters: UsageFilters = {}): { data?: UsageChartData; isLoading: boolean; error?: unknown } {
  return useQuery({
    queryKey: ["aggregated-usage-chart", filters],
    queryFn: async (): Promise<UsageChartData> => {
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      const start = filters.startDate ? new Date(filters.startDate) : addDays(end, -29);
      const startStr = toDateString(start);
      const endStr = toDateString(end);

      let query = (supabase as any)
        .from("api_usage_daily_aggregates")
        .select("date, request_type, function_name, model_used, total_requests, total_success, total_estimated_cost")
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true });

      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.functionName) query = query.eq("function_name", filters.functionName);
      if (filters.requestType) query = query.eq("request_type", filters.requestType);

      const { data, error } = await query;
      if (error) throw error;

      // If no aggregates yet, fallback to computing from tracking table directly
      let rows = data as any[];
      if (!rows || rows.length === 0) {
        let evq = (supabase as any)
          .from("api_usage_tracking")
          .select("created_at, request_type, function_name, model_used, estimated_cost, success")
          .gte("created_at", `${startStr}T00:00:00.000Z`)
          .lte("created_at", `${endStr}T23:59:59.999Z`)
          .order("created_at", { ascending: true });
        if (filters.userId) evq = evq.eq("user_id", filters.userId);
        if (filters.functionName) evq = evq.eq("function_name", filters.functionName);
        if (filters.requestType) evq = evq.eq("request_type", filters.requestType);
        const { data: evs, error: evErr } = await evq;
        if (evErr) throw evErr;
        // Transform events to pseudo-aggregate rows for the reduction below
        rows = (evs || []).map((e: any) => ({
          date: toDateString(new Date(e.created_at)),
          request_type: e.request_type,
          function_name: e.function_name,
          model_used: e.model_used,
          total_requests: 1,
          total_success: e.success ? 1 : 0,
          total_estimated_cost: Number(e.estimated_cost || 0),
        }));
      }

      // Initialize map for each day in range to ensure contiguous dates
      const dailyMap = new Map<string, {
        date: string;
        text_generation_cost: number;
        image_generation_cost: number;
        image_prompt_cost: number;
        total_cost: number;
        total_requests: number;
        successes: number;
      }>();

      // Build all dates between start and end
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
        const ds = toDateString(d);
        dailyMap.set(ds, {
          date: ds,
          text_generation_cost: 0,
          image_generation_cost: 0,
          image_prompt_cost: 0,
          total_cost: 0,
          total_requests: 0,
          successes: 0,
        });
      }

      // Distributions across the window
      const functionDist = new Map<string, { function_name: string; cost: number; requests: number }>();
      const modelUsage = new Map<string, { model: string; cost: number; requests: number }>();

      for (const row of rows || []) {
        const ds = row.date as string;
        const entry = dailyMap.get(ds);
        if (!entry) continue;

        const cost = Number(row.total_estimated_cost || 0);
        const reqs = Number(row.total_requests || 0);
        entry.total_requests += reqs;
        entry.total_cost += cost;
        entry.successes += Number(row.total_success || 0);

        switch (row.request_type) {
          case "text_generation":
            entry.text_generation_cost += cost;
            break;
          case "image_generation":
            entry.image_generation_cost += cost;
            break;
          case "image_prompt":
            entry.image_prompt_cost += cost;
            break;
          default:
            break;
        }

        const fn = row.function_name || "(unknown)";
        const fnRec = functionDist.get(fn) || { function_name: fn, cost: 0, requests: 0 };
        fnRec.cost += cost;
        fnRec.requests += reqs;
        functionDist.set(fn, fnRec);

        const model = row.model_used || "(unknown)";
        const modelRec = modelUsage.get(model) || { model, cost: 0, requests: 0 };
        modelRec.cost += cost;
        modelRec.requests += reqs;
        modelUsage.set(model, modelRec);
      }

      const daily_costs = Array.from(dailyMap.values());

      const success_rates = daily_costs.map(d => ({
        date: d.date,
        success_rate: d.total_requests > 0 ? d.successes / d.total_requests : 0,
      }));

      const function_distribution = Array.from(functionDist.values()).sort((a, b) => b.cost - a.cost).slice(0, 10);
      const model_usage_arr = Array.from(modelUsage.values()).sort((a, b) => b.cost - a.cost).slice(0, 10);

      return {
        daily_costs,
        function_distribution,
        model_usage: model_usage_arr,
        success_rates,
      };
    },
  });
}
