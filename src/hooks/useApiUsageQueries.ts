import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageRecord, UsageSummary, UsageFilters, UsageChartData } from '@/types/apiUsage';

// For now, we'll return mock data since the backend doesn't exist yet
// This will be replaced with actual Supabase queries later

const generateMockUsageData = (): ApiUsageRecord[] => {
  const mockData: ApiUsageRecord[] = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(now.getTime() - i * 3600000); // Go back i hours
    mockData.push({
      id: `mock-${i}`,
      user_id: `user-${Math.floor(Math.random() * 5) + 1}`,
      user_email: `user${Math.floor(Math.random() * 5) + 1}@example.com`,
      user_name: `User ${Math.floor(Math.random() * 5) + 1}`,
      function_name: ['generate-image-prompt-dynamic', 'generate-image-gpt'][Math.floor(Math.random() * 2)],
      model_used: ['gpt-4o-mini', 'dall-e-3'][Math.floor(Math.random() * 2)],
      request_type: ['text_generation', 'image_generation'][Math.floor(Math.random() * 2)] as any,
      tokens_used: Math.floor(Math.random() * 2000) + 100,
      image_size: '1024x1024',
      image_quality: ['standard', 'hd'][Math.floor(Math.random() * 2)],
      estimated_cost: Math.random() * 0.5,
      success: Math.random() > 0.1, // 90% success rate
      error_message: Math.random() > 0.1 ? undefined : 'Rate limit exceeded',
      request_metadata: { post_id: `post-${i}`, category: 'test' },
      prompt_tokens: Math.floor(Math.random() * 1000) + 50,
      completion_tokens: Math.floor(Math.random() * 1000) + 50,
      total_tokens: Math.floor(Math.random() * 2000) + 100,
      response_time_ms: Math.floor(Math.random() * 5000) + 500,
      created_at: date.toISOString(),
    });
  }
  
  return mockData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const generateMockSummary = (): UsageSummary => ({
  total_cost_today: 12.45,
  total_cost_week: 89.32,
  total_cost_month: 342.18,
  total_requests_today: 156,
  total_requests_week: 1203,
  total_requests_month: 4567,
  total_tokens_today: 89234,
  total_tokens_week: 567890,
  total_tokens_month: 2345678,
  success_rate_today: 0.94,
  success_rate_week: 0.92,
  success_rate_month: 0.91,
  top_users: [
    { user_id: 'user-1', user_email: 'user1@example.com', user_name: 'User 1', total_cost: 125.32, total_requests: 450 },
    { user_id: 'user-2', user_email: 'user2@example.com', user_name: 'User 2', total_cost: 89.45, total_requests: 320 },
    { user_id: 'user-3', user_email: 'user3@example.com', user_name: 'User 3', total_cost: 67.23, total_requests: 280 },
  ],
  top_functions: [
    { function_name: 'generate-image-gpt', total_cost: 198.45, total_requests: 2340 },
    { function_name: 'generate-image-prompt-dynamic', total_cost: 143.73, total_requests: 2227 },
  ],
});

const generateMockChartData = (): UsageChartData => ({
  daily_costs: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    text_generation_cost: Math.random() * 10,
    image_generation_cost: Math.random() * 15,
    image_prompt_cost: Math.random() * 5,
    total_cost: Math.random() * 30,
    total_requests: Math.floor(Math.random() * 200) + 50,
  })).reverse(),
  function_distribution: [
    { function_name: 'generate-image-gpt', cost: 198.45, requests: 2340 },
    { function_name: 'generate-image-prompt-dynamic', cost: 143.73, requests: 2227 },
  ],
  model_usage: [
    { model: 'gpt-4o-mini', cost: 156.32, requests: 3245 },
    { model: 'dall-e-3', cost: 185.86, requests: 1322 },
  ],
  success_rates: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    success_rate: 0.85 + Math.random() * 0.15,
  })).reverse(),
});

export const useApiUsageData = (filters: UsageFilters = {}, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: ['api-usage', filters, page, pageSize],
    queryFn: async () => {
      // Mock implementation - replace with actual Supabase query
      const allData = generateMockUsageData();
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return {
        data: allData.slice(start, end),
        total: allData.length,
        page,
        pageSize,
        totalPages: Math.ceil(allData.length / pageSize),
      };
    },
  });
};

export const useUsageSummary = () => {
  return useQuery({
    queryKey: ['usage-summary'],
    queryFn: async () => {
      // Mock implementation - replace with actual Supabase query
      return generateMockSummary();
    },
  });
};

export const useUsageChartData = (filters: UsageFilters = {}) => {
  return useQuery({
    queryKey: ['usage-chart-data', filters],
    queryFn: async () => {
      // Mock implementation - replace with actual Supabase query
      return generateMockChartData();
    },
  });
};

export const useUsageByUser = (userId?: string) => {
  return useQuery({
    queryKey: ['usage-by-user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Mock implementation - replace with actual Supabase query
      const allData = generateMockUsageData();
      return allData.filter(record => record.user_id === userId);
    },
    enabled: !!userId,
  });
};

export const useUsageByFunction = (functionName?: string) => {
  return useQuery({
    queryKey: ['usage-by-function', functionName],
    queryFn: async () => {
      if (!functionName) return null;
      
      // Mock implementation - replace with actual Supabase query
      const allData = generateMockUsageData();
      return allData.filter(record => record.function_name === functionName);
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