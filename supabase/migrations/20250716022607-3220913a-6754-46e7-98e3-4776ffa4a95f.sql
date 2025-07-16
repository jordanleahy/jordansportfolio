-- Create a temporary function to add coding ai data for all users
CREATE OR REPLACE FUNCTION add_coding_ai_data_for_user(target_user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  INSERT INTO public.social_media_posts (
    day, title, description, theme, category, user_id, status
  ) VALUES
  (1, 'Autonomous Coding Has Arrived', 'AI is set to take over the repetitive work of medical coding, turning a labor-intensive process into a continuous, automated workflow. Industry experts note that fully autonomous coding is "the clear direction of travel" for healthcare, given the persistent shortage of coders and high administrative costs. This bold shift promises to eliminate reliance on offshore coding labor while boosting efficiency and accuracy across U.S. inpatient and outpatient settings.', 'autonomous coding', 'coding ai', target_user_id, 'draft'),
  (2, 'Instant Codes from Clinical Text', 'Today''s medical coders often sift through 50,000 words (half a novel) in a single patient record – only to distill it into about 19 billing codes chosen from 140,000+ possibilities. They repeat this tedious task multiple times an hour. AI sees this massive reading and coding workload as a bottleneck begging for automation. By leveraging natural language processing to understand clinical text, AI can instantly interpret documentation and output the proper CPT and ICD-10 codes, transforming hours of human work into seconds of processing.', 'autonomous coding', 'coding ai', target_user_id, 'draft'),
  (3, 'Coding in Real-Time, Not Afterward', 'Continuous coding is on the horizon: AI systems will code medical encounters in real-time as care is delivered, rather than days or weeks later. In both inpatient hospital stays and outpatient visits, AI-driven coding engines can parse clinical notes and assign codes within seconds of documentation. This real-time approach means billing processes start immediately, reducing backlogs and enabling healthcare providers to get reimbursed faster. The vision: no more end-of-day or end-of-week coding batches – just immediate, autonomous coding after each encounter.', 'autonomous coding', 'coding ai', target_user_id, 'draft'),
  (4, 'No More Offshore Coders', 'U.S. healthcare providers have long relied on offshore teams for manual coding, but AI will bring coding back onshore (and in-house) digitally. By automating repetitive coding tasks with high accuracy, hospitals can reduce or eliminate outsourcing agreements. Not only does this cut costs, it also addresses labor shortages at home. AI coding engines work 24/7 without fatigue, meaning health systems can achieve round-the-clock coding without chasing offshore labor pools.', 'autonomous coding', 'coding ai', target_user_id, 'draft'),
  (5, 'Let AI Handle the Repetitive Stuff', 'Routine cases like normal X-rays, lab tests, or standard check-ups are repetitive and ripe for automation. Today, expert coders spend valuable time on such mundane tasks, but AI can handle them instantly. By training AI on the most common scenarios, every repetitive coding task can be done via a standardized prompt to an AI model. This frees human coders to focus on complex, edge-case scenarios.', 'autonomous coding', 'coding ai', target_user_id, 'draft');
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Add the first 5 posts to see if it works
SELECT add_coding_ai_data_for_user((SELECT DISTINCT user_id FROM social_media_posts LIMIT 1)) as inserted_count;