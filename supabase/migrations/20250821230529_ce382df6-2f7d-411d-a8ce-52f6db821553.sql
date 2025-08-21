-- Create real agent relationships based on actual dependencies
-- Get agent IDs for reference
WITH agent_ids AS (
  SELECT 
    id,
    name
  FROM openai_agents
),
visual_prompt_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Visual Prompt Generator'
),
system_prompt_agent AS (
  SELECT id FROM agent_ids WHERE name = 'System Prompt Generator'
),
blog_content_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Blog Content Generator'
),
social_media_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Social Media Agent'
),
comparison_pages_agent AS (
  SELECT id FROM agent_ids WHERE name = 'GenerateComparisonPages'
),
vendor_processor_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Vendor JSON Processor'
),
story_telling_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Story Telling Agent'
),
cover_letter_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Cover Letter Generator'
),
work_report_agent AS (
  SELECT id FROM agent_ids WHERE name = 'Engineering Work Report Agent'
)

-- Insert required dependencies
INSERT INTO agent_relationships (source_agent_id, target_agent_id, relationship_type, description, is_required)
SELECT 
  vp.id,
  sp.id,
  'dependency',
  'Visual Prompt Generator requires system prompts to generate context-aware image prompts',
  true
FROM visual_prompt_agent vp, system_prompt_agent sp
WHERE EXISTS (SELECT 1 FROM visual_prompt_agent) AND EXISTS (SELECT 1 FROM system_prompt_agent)

UNION ALL

SELECT 
  bc.id,
  sm.id,
  'dependency',
  'Blog Content Generator uses Social Media Agent to create platform-specific promotional content',
  true
FROM blog_content_agent bc, social_media_agent sm
WHERE EXISTS (SELECT 1 FROM blog_content_agent) AND EXISTS (SELECT 1 FROM social_media_agent)

UNION ALL

SELECT 
  cp.id,
  vp.id,
  'dependency',
  'Comparison Pages Generator depends on Vendor JSON Processor for structured company data',
  true
FROM comparison_pages_agent cp, vendor_processor_agent vp
WHERE EXISTS (SELECT 1 FROM comparison_pages_agent) AND EXISTS (SELECT 1 FROM vendor_processor_agent)

UNION ALL

-- Insert optional dependencies
SELECT 
  st.id,
  sm.id,
  'dependency',
  'Story Telling Agent can leverage Social Media Agent insights for narrative adaptation',
  false
FROM story_telling_agent st, social_media_agent sm
WHERE EXISTS (SELECT 1 FROM story_telling_agent) AND EXISTS (SELECT 1 FROM social_media_agent)

UNION ALL

SELECT 
  cl.id,
  sp.id,
  'dependency',
  'Cover Letter Generator can use System Prompt Generator for personalized prompt templates',
  false
FROM cover_letter_agent cl, system_prompt_agent sp
WHERE EXISTS (SELECT 1 FROM cover_letter_agent) AND EXISTS (SELECT 1 FROM system_prompt_agent)

UNION ALL

SELECT 
  wr.id,
  sp.id,
  'dependency',
  'Work Report Agent can use System Prompt Generator for structured reporting templates',
  false
FROM work_report_agent wr, system_prompt_agent sp
WHERE EXISTS (SELECT 1 FROM work_report_agent) AND EXISTS (SELECT 1 FROM system_prompt_agent);