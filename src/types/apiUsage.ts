export interface ApiUsageRecord {
  id: string;
  user_id: string;
  function_name: string;
  model_used: string;
  request_type: 'text_generation' | 'image_generation' | 'image_prompt';
  tokens_used?: number;
  image_size?: string;
  image_quality?: string;
  estimated_cost: number;
  success: boolean;
  error_message?: string;
  request_metadata?: Record<string, any>;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  response_time_ms?: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
  // OpenAI sync fields
  openai_request_id?: string;
  openai_synced?: boolean;
  actual_cost?: number;
  openai_timestamp?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
}

export interface OpenAIUsageSyncLog {
  id: string;
  sync_date: string;
  records_synced: number;
  total_cost_synced: number;
  sync_status: 'success' | 'partial_success' | 'failed';
  error_details?: Record<string, any>;
  sync_type: string;
  created_at: string;
  updated_at: string;
}

export interface UsageSummary {
  total_cost_today: number;
  total_cost_week: number;
  total_cost_month: number;
  total_requests_today: number;
  total_requests_week: number;
  total_requests_month: number;
  total_tokens_today: number;
  total_tokens_week: number;
  total_tokens_month: number;
  success_rate_today: number;
  success_rate_week: number;
  success_rate_month: number;
  top_users: Array<{
    user_id: string;
    user_email?: string;
    user_name?: string;
    total_cost: number;
    total_requests: number;
  }>;
  top_functions: Array<{
    function_name: string;
    total_cost: number;
    total_requests: number;
  }>;
}

export interface CostBreakdown {
  date: string;
  text_generation_cost: number;
  image_generation_cost: number;
  image_prompt_cost: number;
  total_cost: number;
  total_requests: number;
}

export interface UserUsageStats {
  user_id: string;
  user_email?: string;
  user_name?: string;
  total_cost: number;
  total_requests: number;
  success_rate: number;
  last_request: string;
  breakdown_by_function: Array<{
    function_name: string;
    cost: number;
    requests: number;
  }>;
}

export interface UsageFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  functionName?: string;
  requestType?: string;
  success?: boolean;
}

export interface UsageChartData {
  daily_costs: CostBreakdown[];
  function_distribution: Array<{
    function_name: string;
    cost: number;
    requests: number;
  }>;
  model_usage: Array<{
    model: string;
    cost: number;
    requests: number;
  }>;
  success_rates: Array<{
    date: string;
    success_rate: number;
  }>;
}