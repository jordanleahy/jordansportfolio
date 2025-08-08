-- Add RLS policy for users to view their own usage data
CREATE POLICY "Users can view their own usage data"
  ON public.api_usage_tracking 
  FOR SELECT 
  USING (auth.uid() = user_id);