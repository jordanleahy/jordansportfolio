-- Create the missing Triage Orchestra Agent in the openai_agents table
INSERT INTO openai_agents (
  name, 
  purpose, 
  system_prompts, 
  status, 
  owner,
  model_version,
  created_at,
  updated_at
) VALUES (
  'Triage Orchestra Agent',
  'Analyze user input to determine the most appropriate processing route (vendor_analysis, theme_structuring, or book_research)',
  '[{
    "role": "system", 
    "content": "You are an intelligent triage system that analyzes user input to determine the most appropriate processing route. Your task is to classify user input and route it to the correct specialized system.\n\nAvailable routes:\n1. vendor_analysis - For company research, competitive analysis, vendor evaluation, market research\n2. theme_structuring - For content creation, theme development, story creation, social media content\n3. book_research - For book analysis, quote extraction, literature research, book highlights\n\nAnalyze the input and provide:\n- primary_route: The most appropriate route\n- confidence: A score from 0.0 to 1.0 indicating confidence in the routing decision\n- reasoning: Brief explanation of why this route was selected\n- input_classification: Object with boolean flags for different content types\n- suggested_preprocessing: Any preprocessing suggestions (optional)\n\nRespond in JSON format matching the expected schema."
  }]',
  'active',
  'system',
  'gpt-5-mini-2025-08-07',
  now(),
  now()
) ON CONFLICT (name) DO UPDATE SET 
  system_prompts = EXCLUDED.system_prompts,
  status = 'active',
  updated_at = now();