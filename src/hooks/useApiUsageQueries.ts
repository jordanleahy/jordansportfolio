import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageRecord, UsageSummary, UsageFilters, UsageChartData } from '@/types/apiUsage';
import { logger } from '@/services/logger';

export const useApiUsageData = (filters: UsageFilters = {}, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: ['api-usage', filters, page, pageSize],
    queryFn: async () => {
      logger.debug('Fetching API usage data', { filters, page, pageSize });
      // Query api_usage_tracking directly
      let eventsQuery: any = (supabase as any)
        .from('api_usage_tracking')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters to events
      if (filters.startDate) {
        eventsQuery = eventsQuery.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        eventsQuery = eventsQuery.lte('created_at', filters.endDate);
      }
      if (filters.userId) {
        eventsQuery = eventsQuery.eq('user_id', filters.userId);
      }
      if (filters.functionName) {
        eventsQuery = eventsQuery.eq('function_name', filters.functionName);
      }
      if (filters.requestType) {
        eventsQuery = eventsQuery.eq('request_type', filters.requestType);
      }
      if (filters.success !== undefined) {
        eventsQuery = eventsQuery.eq('success', filters.success);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      eventsQuery = eventsQuery.range(from, to);

      let { data, error, count } = await eventsQuery;



      if (error) {
        logger.error('Error fetching API usage data', error);
        throw error;
      }

      // Get unique user IDs to fetch profiles
      const userIds = Array.from(new Set((data || []).map((record: any) => record.user_id).filter((v: any) => !!v))) as string[];
      
      // Fetch user profiles
      let profiles: any[] | null = null;
      if (userIds.length > 0) {
        const { data: pData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds as any);
        if (profilesError) {
          logger.error('Error fetching profiles', profilesError);
        }
        profiles = pData as any[] | null;
      } else {
        profiles = [];
      }

      // Create a map for quick profile lookup
      const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Transform data to match our interface
      const transformedData: ApiUsageRecord[] = (data || []).map(record => {
        const userProfile = profileMap[record.user_id];
        return {
        id: record.id,
        user_id: record.user_id,
        function_name: record.function_name,
        model_used: record.model_used,
        request_type: record.request_type as 'text_generation' | 'image_generation' | 'image_prompt',
        tokens_used: record.tokens_used || undefined,
        image_size: record.image_size || undefined,
        image_quality: record.image_quality || undefined,
        estimated_cost: Number(record.estimated_cost),
        actual_cost: record.actual_cost !== undefined && record.actual_cost !== null ? Number(record.actual_cost) : undefined,
        success: record.success,
        error_message: record.error_message || undefined,
        request_metadata: (typeof record.request_metadata === 'object' && record.request_metadata !== null) 
          ? record.request_metadata as Record<string, any> 
          : {},
        prompt_tokens: record.prompt_tokens || undefined,
        completion_tokens: record.completion_tokens || undefined,
        total_tokens: record.total_tokens || undefined,
        response_time_ms: record.response_time_ms || undefined,
        created_at: record.created_at,
        user_email: userProfile?.email || 'Unknown',
        user_name: userProfile?.full_name || 'Unknown User',
        openai_request_id: (record as any).openai_request_id || undefined,
        sync_status: (record as any).sync_status || undefined,
        openai_synced: (record as any).openai_synced || undefined,
        openai_timestamp: (record as any).openai_timestamp || undefined,
        };
      });

      return {
        data: transformedData,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
};

export const useAdminUsageSummary = () => {
  return useQuery({
    queryKey: ['admin-usage-summary-live'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Helper to fetch and reduce live tracking data
      const fetchRange = async (startDate: Date, endDate?: Date) => {
        let query = supabase
          .from('api_usage_tracking')
          .select('*')
          .gte('created_at', startDate.toISOString());
        
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const totals = (data || []).reduce(
          (acc, r) => {
            acc.totalCost += Number(r.estimated_cost || 0);
            acc.totalRequests += 1;
            acc.totalTokens += Number(r.total_tokens || r.tokens_used || 0);
            if (r.success) acc.successes += 1;
            return acc;
          },
          { totalCost: 0, totalRequests: 0, totalTokens: 0, successes: 0 }
        );
        const successRate = totals.totalRequests > 0 ? totals.successes / totals.totalRequests : 0;
        return { ...totals, successRate, rows: data || [] };
      };

      // Get today's end time for precise today calculation
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const todayAgg = await fetchRange(todayStart, todayEnd);
      const weekAgg = await fetchRange(weekStart);
      const monthAgg = await fetchRange(monthStart);

      // Top users and functions from month data
      const userMap = new Map<string, { cost: number; requests: number }>();
      const funcMap = new Map<string, { cost: number; requests: number }>();
      
      for (const r of monthAgg.rows) {
        const uid = r.user_id || '(unknown)';
        const fm = r.function_name || '(unknown)';
        const cost = Number(r.estimated_cost || 0);
        const reqs = 1;
        
        const u = userMap.get(uid) || { cost: 0, requests: 0 };
        u.cost += cost; u.requests += reqs; userMap.set(uid, u);
        
        const f = funcMap.get(fm) || { cost: 0, requests: 0 };
        f.cost += cost; f.requests += reqs; funcMap.set(fm, f);
      }

      // Get user profiles for top users
      const topUsersIds = Array.from(userMap.keys()).filter(id => id !== '(unknown)');
      const { data: profiles } = topUsersIds.length > 0
        ? await supabase.from('profiles').select('user_id, email, full_name').in('user_id', topUsersIds)
        : { data: [] as any[] };
      
      const profileMap = (profiles || []).reduce((acc, p) => { 
        acc[p.user_id] = p; 
        return acc; 
      }, {} as Record<string, any>);

      const top_users = Array.from(userMap.entries())
        .map(([user_id, v]) => ({
          user_id,
          user_email: profileMap[user_id]?.email || 'Unknown',
          user_name: profileMap[user_id]?.full_name || 'Unknown User',
          total_cost: v.cost,
          total_requests: v.requests,
        }))
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 3);

      const top_functions = Array.from(funcMap.entries())
        .map(([function_name, v]) => ({ 
          function_name, 
          total_cost: v.cost, 
          total_requests: v.requests 
        }))
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 5);

      const summary: UsageSummary = {
        total_cost_today: todayAgg.totalCost,
        total_cost_week: weekAgg.totalCost,
        total_cost_month: monthAgg.totalCost,
        total_requests_today: todayAgg.totalRequests,
        total_requests_week: weekAgg.totalRequests,
        total_requests_month: monthAgg.totalRequests,
        total_tokens_today: todayAgg.totalTokens,
        total_tokens_week: weekAgg.totalTokens,
        total_tokens_month: monthAgg.totalTokens,
        success_rate_today: todayAgg.successRate,
        success_rate_week: weekAgg.successRate,
        success_rate_month: monthAgg.successRate,
        top_users,
        top_functions,
      };

      return summary;
    },
  });
};

export const useUsageChartData = (filters: UsageFilters = {}) => {
  return useQuery({
    queryKey: ['usage-chart-data', filters],
    queryFn: async () => {
      logger.debug('Fetching usage chart data');
      
      // Get data for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group data by date
      const dailyData = (data || []).reduce((acc: any, record) => {
        const date = record.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            text_generation_cost: 0,
            image_generation_cost: 0,
            image_prompt_cost: 0,
            total_cost: 0,
            total_requests: 0,
          };
        }
        
        const cost = Number(record.estimated_cost || 0);
        acc[date].total_cost += cost;
        acc[date].total_requests++;
        
        if (record.request_type === 'text_generation') {
          acc[date].text_generation_cost += cost;
        } else if (record.request_type === 'image_generation') {
          acc[date].image_generation_cost += cost;
        } else if (record.request_type === 'image_prompt') {
          acc[date].image_prompt_cost += cost;
        }
        
        return acc;
      }, {});

      // Convert to array and fill missing dates
      const dailyCosts = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dailyCosts.push(dailyData[date] || {
          date,
          text_generation_cost: 0,
          image_generation_cost: 0,
          image_prompt_cost: 0,
          total_cost: 0,
          total_requests: 0,
        });
      }

      // Calculate function and model distributions
      const functionDist = (data || []).reduce((acc: any, record) => {
        const funcName = record.function_name;
        if (!acc[funcName]) {
          acc[funcName] = { function_name: funcName, cost: 0, requests: 0 };
        }
        acc[funcName].cost += Number(record.estimated_cost || 0);
        acc[funcName].requests++;
        return acc;
      }, {});

      const modelDist = (data || []).reduce((acc: any, record) => {
        const model = record.model_used;
        if (!acc[model]) {
          acc[model] = { model, cost: 0, requests: 0 };
        }
        acc[model].cost += Number(record.estimated_cost || 0);
        acc[model].requests++;
        return acc;
      }, {});

      // Calculate daily success rates
      const successRates = dailyCosts.map(day => {
        const dayData = (data || []).filter(record => 
          record.created_at.split('T')[0] === day.date
        );
        return {
          date: day.date,
          success_rate: dayData.length > 0 ? 
            dayData.filter(r => r.success).length / dayData.length : 0,
        };
      });

      const chartData: UsageChartData = {
        daily_costs: dailyCosts,
        function_distribution: Object.values(functionDist),
        model_usage: Object.values(modelDist),
        success_rates: successRates,
      };

      return chartData;
    },
  });
};

export const useUsageByUser = (userId?: string) => {
  return useQuery({
    queryKey: ['usage-by-user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useUsageByFunction = (functionName?: string) => {
  return useQuery({
    queryKey: ['usage-by-function', functionName],
    queryFn: async () => {
      if (!functionName) return null;
      
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('function_name', functionName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!functionName,
  });
};

// Utility hook for managing filters state
export const useUsageFilters = () => {
  const [filters, setFilters] = useState<UsageFilters>({});
  
  const updateFilter = (key: keyof UsageFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({});
  };
  
  return {
    filters,
    updateFilter,
    clearFilters,
    setFilters,
  };
};