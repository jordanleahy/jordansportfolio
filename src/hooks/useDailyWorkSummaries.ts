import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS, QUERY_CONFIG } from '@/constants/queryKeys';

export interface DailyWorkSummary {
  id: string;
  user_id: string;
  summary_date: string;
  metrics: {
    totalTasks?: number;
    completedTasks?: number;
    timeSpent?: string;
    completionRate?: number;
    focusTime?: string;
    breakTime?: string;
  };
  highlights: string[];
  challenges: string[];
  insights: string[];
  recommendations: string[];
  mood_score?: number;
  productivity_score?: number;
  categories_summary: {
    technical?: {
      tasks: string[];
      timeSpent: string;
      insights: string[];
    };
    creative?: {
      tasks: string[];
      timeSpent: string;
      insights: string[];
    };
    productivity?: {
      tasks: string[];
      timeSpent: string;
      insights: string[];
    };
    insights?: {
      tasks: string[];
      timeSpent: string;
      insights: string[];
    };
  };
  generated_summary: string;
  summary_type: string;
  created_at: string;
  updated_at: string;
}

// Enhanced hook with pagination and performance optimizations
export const useDailyWorkSummaries = (options?: {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { limit = 30, offset = 0, dateFrom, dateTo } = options || {};
  
  return useQuery({
    queryKey: QUERY_KEYS.workSummariesPaginated(Math.floor(offset / limit), limit),
    queryFn: async () => {
      let query = supabase
        .from('daily_work_summaries')
        .select(`
          id,
          user_id,
          summary_date,
          metrics,
          highlights,
          categories_summary,
          productivity_score,
          mood_score,
          summary_type,
          created_at
        `)
        .order('summary_date', { ascending: false })
        .range(offset, offset + limit - 1);

      // Add date filtering if provided
      if (dateFrom) {
        query = query.gte('summary_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('summary_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyWorkSummary[];
    },
    staleTime: QUERY_CONFIG.WORK_SUMMARIES_STALE_TIME,
    gcTime: QUERY_CONFIG.WORK_SUMMARIES_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Original hook for backward compatibility - now optimized
export const useDailyWorkSummariesAll = () => {
  return useQuery({
    queryKey: QUERY_KEYS.workSummaries,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_work_summaries')
        .select('*')
        .order('summary_date', { ascending: false })
        .limit(100); // Limit to prevent performance issues

      if (error) throw error;
      return data as DailyWorkSummary[];
    },
    staleTime: QUERY_CONFIG.WORK_SUMMARIES_STALE_TIME,
    gcTime: QUERY_CONFIG.WORK_SUMMARIES_GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useDailyWorkSummary = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.workSummary(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_work_summaries')
        .select('*')
        .eq('summary_date', date)
        .maybeSingle();

      if (error) throw error;
      return data as DailyWorkSummary | null;
    },
    staleTime: QUERY_CONFIG.WORK_SUMMARIES_STALE_TIME,
    gcTime: QUERY_CONFIG.WORK_SUMMARIES_GC_TIME,
    enabled: !!date, // Only run query if date is provided
    refetchOnWindowFocus: false,
  });
};