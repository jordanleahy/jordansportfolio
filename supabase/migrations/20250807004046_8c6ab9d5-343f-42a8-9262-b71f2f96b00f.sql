-- Fix the security definer view by adding RLS policies
DROP VIEW IF EXISTS work_reports_optimized;

-- Add RLS policies for the optimized view access directly on the table
-- Users can view their own summaries
CREATE POLICY IF NOT EXISTS "Users can view optimized summaries" 
ON daily_work_summaries FOR SELECT 
USING (auth.uid() = user_id);