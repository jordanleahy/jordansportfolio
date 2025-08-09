-- Add Stripe price IDs to map payments to correct tiers
-- Note: These are placeholder price IDs - update with your actual Stripe price IDs

-- Update Starter plan with a placeholder price ID (you'll need to update this with your actual Stripe price ID)
UPDATE subscription_tiers 
SET stripe_price_id = 'price_starter_25_monthly' 
WHERE name = 'Starter' AND price_cents = 2500;

-- Update other tiers with placeholder price IDs for future use
UPDATE subscription_tiers 
SET stripe_price_id = 'price_pro_26_monthly' 
WHERE name = 'Pro Plan - GPT Images' AND price_cents = 2600;

-- Free plan doesn't need a stripe_price_id since it's not a paid plan
UPDATE subscription_tiers 
SET stripe_price_id = null 
WHERE name = 'Free Plan' AND price_cents = 0;