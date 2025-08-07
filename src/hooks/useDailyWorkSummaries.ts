import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useDailyWorkSummaries = () => {
  return useQuery({
    queryKey: ['daily-work-summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_work_summaries')
        .select('*')
        .order('summary_date', { ascending: false });

      if (error) throw error;
      return data as DailyWorkSummary[];
    },
  });
};

export const useDailyWorkSummary = (date: string) => {
  return useQuery({
    queryKey: ['daily-work-summary', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_work_summaries')
        .select('*')
        .eq('summary_date', date)
        .maybeSingle();

      if (error) throw error;
      return data as DailyWorkSummary | null;
    },
  });
};