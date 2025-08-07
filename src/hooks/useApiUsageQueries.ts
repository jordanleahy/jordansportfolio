import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageRecord, UsageSummary, UsageFilters, UsageChartData } from '@/types/apiUsage';

export const useApiUsageData = (filters: UsageFilters = {}, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: ['api-usage', filters, page, pageSize],
    queryFn: async () => {
      console.log('Fetching API usage data with filters:', filters);
      
      // First get the usage data
      let usageQuery = supabase
        .from('api_usage_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        usageQuery = usageQuery.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        usageQuery = usageQuery.lte('created_at', filters.endDate);
      }
      if (filters.userId) {
        usageQuery = usageQuery.eq('user_id', filters.userId);
      }
      if (filters.functionName) {
        usageQuery = usageQuery.eq('function_name', filters.functionName);
      }
      if (filters.requestType) {
        usageQuery = usageQuery.eq('request_type', filters.requestType);
      }
      if (filters.success !== undefined) {
        usageQuery = usageQuery.eq('success', filters.success);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      usageQuery = usageQuery.range(from, to);

      const { data, error, count } = await usageQuery;

      if (error) {
        console.error('Error fetching API usage data:', error);
        throw error;
      }

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set((data || []).map(record => record.user_id))];
      
      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
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
        user_name: userProfile?.full_name || 'Unknown User'
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

export const useUsageSummary = () => {
  return useQuery({
    queryKey: ['usage-summary'],
    queryFn: async () => {
      console.log('Fetching usage summary');
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get today's stats
      const { data: todayData, error: todayError } = await supabase
        .from('api_usage_tracking')
        .select('estimated_cost, tokens_used, success')
        .gte('created_at', todayStart.toISOString());

      if (todayError) throw todayError;

      // Get week's stats
      const { data: weekData, error: weekError } = await supabase
        .from('api_usage_tracking')
        .select('estimated_cost, tokens_used, success')
        .gte('created_at', weekStart.toISOString());

      if (weekError) throw weekError;

      // Get month's stats
      const { data: monthData, error: monthError } = await supabase
        .from('api_usage_tracking')
        .select('estimated_cost, tokens_used, success, user_id, function_name')
        .gte('created_at', monthStart.toISOString());

      if (monthError) throw monthError;

      // Calculate summaries
      const calculateStats = (data: any[]) => ({
        totalCost: data.reduce((sum, record) => sum + Number(record.estimated_cost || 0), 0),
        totalRequests: data.length,
        totalTokens: data.reduce((sum, record) => sum + Number(record.tokens_used || 0), 0),
        successRate: data.length > 0 ? data.filter(r => r.success).length / data.length : 0,
      });

      const todayStats = calculateStats(todayData || []);
      const weekStats = calculateStats(weekData || []);
      const monthStats = calculateStats(monthData || []);

      // Calculate top users and functions from month data
      const userCosts = (monthData || []).reduce((acc: any, record) => {
        const userId = record.user_id;
        if (!acc[userId]) {
          acc[userId] = { cost: 0, requests: 0 };
        }
        acc[userId].cost += Number(record.estimated_cost || 0);
        acc[userId].requests++;
        return acc;
      }, {});

      const functionCosts = (monthData || []).reduce((acc: any, record) => {
        const funcName = record.function_name;
        if (!acc[funcName]) {
          acc[funcName] = { cost: 0, requests: 0 };
        }
        acc[funcName].cost += Number(record.estimated_cost || 0);
        acc[funcName].requests++;
        return acc;
      }, {});

      // Get user profiles for top users
      const topUserIds = Object.keys(userCosts);
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', topUserIds);

      const userProfileMap = (userProfiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const topUsers = Object.entries(userCosts)
        .map(([userId, stats]: [string, any]) => {
          const profile = userProfileMap[userId];
          return {
            user_id: userId,
            user_email: profile?.email || 'Unknown',
            user_name: profile?.full_name || 'Unknown User',
            total_cost: stats.cost,
            total_requests: stats.requests,
          };
        })
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 3);

      const topFunctions = Object.entries(functionCosts)
        .map(([functionName, stats]: [string, any]) => ({
          function_name: functionName,
          total_cost: stats.cost,
          total_requests: stats.requests,
        }))
        .sort((a, b) => b.total_cost - a.total_cost);

      const summary: UsageSummary = {
        total_cost_today: todayStats.totalCost,
        total_cost_week: weekStats.totalCost,
        total_cost_month: monthStats.totalCost,
        total_requests_today: todayStats.totalRequests,
        total_requests_week: weekStats.totalRequests,
        total_requests_month: monthStats.totalRequests,
        total_tokens_today: todayStats.totalTokens,
        total_tokens_week: weekStats.totalTokens,
        total_tokens_month: monthStats.totalTokens,
        success_rate_today: todayStats.successRate,
        success_rate_week: weekStats.successRate,
        success_rate_month: monthStats.successRate,
        top_users: topUsers,
        top_functions: topFunctions,
      };

      return summary;
    },
  });
};

export const useUsageChartData = (filters: UsageFilters = {}) => {
  return useQuery({
    queryKey: ['usage-chart-data', filters],
    queryFn: async () => {
      console.log('Fetching usage chart data');
      
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