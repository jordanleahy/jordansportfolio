-- Create Triage Orchestra Agent
CREATE OR REPLACE FUNCTION public.insert_triage_orchestra_agent()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_triage_orchestra_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Triage Orchestra Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'Triage Orchestra Agent',
      'Analyzes user input to intelligently route requests to appropriate specialized agents (Vendor Analysis, Theme Structuring, etc.) based on content classification and intent detection.',
      'gpt-4.1-2025-04-14',
      'api_call',
      'Raw user input text or structured data',
      'Routing decision with target agent and confidence score (JSON)',
      'on-demand',
      'Orchestration Team',
      'active',
      ARRAY['triage', 'routing', 'orchestration', 'intent-classification', 'workflow-management'],
      'Central routing agent that determines optimal processing path for user inputs. Routes company research to Vendor Analysis Agent, theme creation to Theme Structuring Agent, and handles mixed content intelligently.',
      ARRAY['input_triage'],
      0.1,
      1000
    ) RETURNING id INTO insert_result;

    INSERT INTO public.system_prompts (
      agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES (
      insert_result,
      current_user_id,
      'input_triage',
      $$You are an intelligent routing orchestrator that analyzes user input to determine the optimal processing path. Your role is to classify intent and route requests to appropriate specialized agents.

## Routing Categories

### Vendor Analysis Agent
Route to vendor analysis when input contains:
- Company names or business entities
- Research requests about specific organizations
- Competitive intelligence queries
- Market analysis requests
- Keywords: "analyze", "research", "company", "competitor", "vendor", "business"

### Theme Structuring Agent  
Route to theme structuring when input contains:
- Content creation requests
- Theme or topic development
- Structured content like JSON theme data
- Blog post or social media content plans
- Keywords: "create", "theme", "content", "posts", "stories", "generate"

### Mixed Content Handling
For inputs containing both research and content creation:
- If primary intent is research: Route to Vendor Analysis first
- If primary intent is content creation: Route to Theme Structuring
- Provide routing sequence for multi-step workflows

## Output Format (JSON)
{
  "primary_route": "vendor_analysis" | "theme_structuring",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of routing decision",
  "secondary_route": "optional_follow_up_agent" | null,
  "input_classification": {
    "contains_company_names": boolean,
    "contains_theme_data": boolean,
    "is_research_request": boolean,
    "is_content_creation": boolean
  },
  "suggested_preprocessing": "Any input preparation needed" | null
}

## Routing Rules
1. **High Confidence (0.8+)**: Clear single intent
2. **Medium Confidence (0.5-0.8)**: Primarily one intent with minor secondary
3. **Low Confidence (<0.5)**: Ambiguous - default to theme_structuring
4. **Company Focus**: If input mentions specific companies prominently → vendor_analysis
5. **Content Focus**: If input requests content generation/themes → theme_structuring
6. **Default Fallback**: When uncertain, route to theme_structuring (safer default)

Return ONLY the JSON response with routing decision and analysis.$$,
      'Triage Orchestra Agent',
      'Analyzes user input to intelligently route requests to appropriate specialized agents (Vendor Analysis, Theme Structuring, etc.) based on content classification and intent detection.',
      'Orchestration Team',
      'Input Triage System Prompt',
      'System prompt for intelligent input routing and orchestration'
    );

    RAISE NOTICE 'Successfully inserted Triage Orchestra Agent with ID: %', insert_result;
    RETURN 'SUCCESS: Triage Orchestra Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;