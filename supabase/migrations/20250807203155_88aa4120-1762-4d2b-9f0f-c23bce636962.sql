-- Update Starter plan price to $25/month
UPDATE public.subscription_tiers
SET price_cents = 2500
WHERE LOWER(name) = 'starter';