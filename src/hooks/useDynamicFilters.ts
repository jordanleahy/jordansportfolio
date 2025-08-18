import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to get available function names from actual usage data
export const useAvailableFunctions = () => {
  return useQuery({
    queryKey: ['available-functions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('function_name')
        .not('function_name', 'is', null);

      if (error) throw error;

      // Get unique function names with their usage counts
      const functionCounts = (data || []).reduce((acc: Record<string, number>, record) => {
        const funcName = record.function_name;
        acc[funcName] = (acc[funcName] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(functionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Hook to get available request types and models
export const useAvailableCategories = () => {
  return useQuery({
    queryKey: ['available-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('request_type, model_used');

      if (error) throw error;

      const requestTypes = Array.from(new Set((data || [])
        .map(r => r.request_type)
        .filter(Boolean)))
        .sort();

      const models = Array.from(new Set((data || [])
        .map(r => r.model_used)
        .filter(Boolean)))
        .sort();

      return { requestTypes, models };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get the actual data date range
export const useDataDateRange = () => {
  return useQuery({
    queryKey: ['data-date-range'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: oldestData, error: oldestError } = await supabase
        .from('api_usage_tracking')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error || oldestError) throw error || oldestError;

      const latest = data?.[0]?.created_at;
      const oldest = oldestData?.[0]?.created_at;

      if (!latest || !oldest) {
        return null;
      }

      const latestDate = new Date(latest);
      const oldestDate = new Date(oldest);
      const totalDays = Math.ceil((latestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        earliest: oldestDate.toISOString().split('T')[0],
        latest: latestDate.toISOString().split('T')[0],
        totalDays,
        suggestedRanges: [
          { label: 'Today', value: 'today' },
          { label: 'Last 7 days', value: 'week' },
          { label: 'Last 30 days', value: 'month' },
          ...(totalDays > 30 ? [{ label: `Last ${Math.min(totalDays, 90)} days`, value: 'quarter' }] : []),
          { label: `All ${totalDays} days`, value: 'all' }
        ]
      };
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
};

// Hook to get export schema based on actual table columns
export const useExportSchema = () => {
  return useQuery({
    queryKey: ['export-schema'],
    queryFn: async () => {
      // Get a sample record to determine available columns
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Return default schema if no data
        return {
          allColumns: [
            'created_at', 'user_id', 'function_name', 'model_used', 'request_type',
            'estimated_cost', 'success', 'total_tokens', 'response_time_ms'
          ],
          defaultColumns: [
            'created_at', 'function_name', 'model_used', 'request_type', 
            'estimated_cost', 'success'
          ]
        };
      }

      const record = data[0];
      const allColumns = Object.keys(record).filter(key => 
        !['id', 'updated_at'].includes(key) // Exclude internal columns
      );

      const defaultColumns = [
        'created_at', 'user_id', 'function_name', 'model_used', 'request_type',
        'estimated_cost', 'success', 'total_tokens', 'response_time_ms'
      ].filter(col => allColumns.includes(col));

      return { allColumns, defaultColumns };
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
  });
};