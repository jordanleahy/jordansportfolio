-- Replace current job targets with high-quality Greenhouse boards
DELETE FROM job_targets;

-- Add high-quality Greenhouse job boards with flexible selectors
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) VALUES
('Stripe (Greenhouse)', 'https://stripe.com/jobs/search?teams=design', 'greenhouse', '[class*="opening"]', true),
('Airbnb (Greenhouse)', 'https://careers.airbnb.com/departments/design/', 'greenhouse', '[class*="opening"]', true),
('Discord (Greenhouse)', 'https://discord.com/jobs', 'greenhouse', '[class*="opening"]', true),
('Notion (Greenhouse)', 'https://www.notion.so/careers', 'greenhouse', '[class*="opening"]', true),
('Shopify (Greenhouse)', 'https://www.shopify.com/careers/search?teams[]=UX%20%26%20Design&', 'greenhouse', '[class*="opening"]', true),
('Linear (Lever)', 'https://jobs.lever.co/linear', 'lever', '[class*="posting"]', true),
('OpenAI (Greenhouse)', 'https://openai.com/careers/search', 'greenhouse', '[class*="opening"]', true),
('Vercel (Lever)', 'https://vercel.com/careers', 'lever', '[class*="posting"]', true);

-- Clean up orphaned monitoring states
DELETE FROM job_monitoring_state 
WHERE target_id NOT IN (SELECT id FROM job_targets);

-- Clean up orphaned job notifications
DELETE FROM job_notifications 
WHERE target_id NOT IN (SELECT id FROM job_targets);