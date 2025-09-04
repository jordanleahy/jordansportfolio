-- Fix security vulnerability: Secure user_subscriptions table with proper RLS policies
-- This table contains sensitive billing data including Stripe customer IDs that must be protected

-- Enable RLS on user_subscriptions table if not already enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view their own subscription data
CREATE POLICY "Users can view their own subscription data" 
ON public.user_subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy 2: Users can only update their own subscription data  
CREATE POLICY "Users can update their own subscription data"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Service role can manage all subscription data (needed for edge functions)
CREATE POLICY "Service role can manage subscription data"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: Allow admins to view all subscription data for support purposes
CREATE POLICY "Admins can view all subscription data"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Policy 5: Only service role can insert new subscriptions (edge functions handle this)
CREATE POLICY "Service role can insert subscription data"
ON public.user_subscriptions
FOR INSERT
TO service_role
WITH CHECK (true);