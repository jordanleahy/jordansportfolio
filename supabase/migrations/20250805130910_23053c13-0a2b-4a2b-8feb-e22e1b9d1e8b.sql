-- Create subscription tiers table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'month',
  max_image_generations INTEGER,
  max_dalle_images INTEGER,
  max_text_generations INTEGER,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE public.user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  image_generations_used INTEGER NOT NULL DEFAULT 0,
  dalle_images_used INTEGER NOT NULL DEFAULT 0,
  text_generations_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, billing_period_start)
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers
CREATE POLICY "Subscription tiers are viewable by everyone" 
ON public.subscription_tiers 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage subscription tiers" 
ON public.subscription_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_usage_tracking
CREATE POLICY "Users can view their own usage" 
ON public.user_usage_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage tracking" 
ON public.user_usage_tracking 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all usage" 
ON public.user_usage_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Insert the basic $20/month tier
INSERT INTO public.subscription_tiers (
  name, 
  price_cents, 
  billing_interval,
  max_image_generations,
  max_dalle_images,
  max_text_generations
) VALUES (
  'Basic Plan',
  2000, -- $20.00
  'month',
  100, -- AI image generations
  10,  -- DALL-E 3 images
  1000 -- Text generations
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_tiers_updated_at
    BEFORE UPDATE ON public.subscription_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_tracking_updated_at
    BEFORE UPDATE ON public.user_usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();