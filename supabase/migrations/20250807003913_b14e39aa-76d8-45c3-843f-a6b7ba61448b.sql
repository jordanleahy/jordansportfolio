-- Add database indexes for performance optimization (non-concurrent)
CREATE INDEX IF NOT EXISTS idx_daily_work_summaries_user_date 
ON daily_work_summaries (user_id, summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_work_summaries_date_performance 
ON daily_work_summaries (summary_date DESC, user_id);

-- Create optimized view for work report queries
CREATE OR REPLACE VIEW work_reports_optimized AS
SELECT 
  id,
  user_id,
  summary_date,
  metrics,
  highlights,
  categories_summary,
  productivity_score,
  mood_score,
  summary_type,
  created_at,
  -- Pre-calculate common aggregations
  (categories_summary::text)::jsonb ? 'technical' as has_technical,
  (categories_summary::text)::jsonb ? 'creative' as has_creative,
  (categories_summary::text)::jsonb ? 'productivity' as has_productivity,
  jsonb_array_length(COALESCE(highlights, '[]'::jsonb)) as highlights_count
FROM daily_work_summaries
WHERE summary_date >= CURRENT_DATE - INTERVAL '6 months';