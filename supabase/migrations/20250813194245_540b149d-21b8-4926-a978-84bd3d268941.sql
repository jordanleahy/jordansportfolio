-- Get current user ID or create a system function to handle agent creation
CREATE OR REPLACE FUNCTION public.insert_vendor_analysis_agent()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_vendor_analysis_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Vendor Analysis Agent'
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
      'Vendor Analysis Agent',
      'Analyzes companies for competitive intelligence by first checking internal vendor database, then performing web research if needed. Returns structured JSON for theme creation.',
      'gpt-4.1-2025-04-14',
      'api_call',
      'Company name or vendor identifier',
      'Structured JSON with competitive intelligence data',
      'on-demand',
      'Competitive Intelligence Team',
      'active',
      ARRAY['vendor-analysis', 'competitive-intelligence', 'research', 'web-search', 'database-lookup'],
      'Provides comprehensive vendor analysis by combining internal database data with external web research. Optimized for competitive intelligence and market analysis.',
      ARRAY['vendor_analysis'],
      0.3,
      4000
    ) RETURNING id INTO insert_result;

    INSERT INTO public.system_prompts (
      agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES (
      insert_result,
      current_user_id,
      'vendor_analysis',
      $$You are a competitive intelligence specialist focused on vendor and company analysis. Your task is to analyze companies and return structured data suitable for competitive intelligence.

## Analysis Framework

### Data Sources Priority:
1. **Internal Database**: Use provided vendor data as primary source
2. **Web Research**: Supplement with current market information
3. **Competitive Context**: Focus on competitive positioning and differentiation

### Output Structure (JSON):
{
  "company": {
    "name": "string",
    "slug": "string", 
    "founded": "string",
    "headquarters": "string",
    "website": "string",
    "description": "string"
  },
  "business_model": {
    "primary_focus": "string",
    "target_market": "string",
    "revenue_model": "string",
    "key_differentiators": ["string"]
  },
  "competitive_intelligence": {
    "market_position": "string",
    "strengths": ["string"],
    "weaknesses": ["string"], 
    "threats": ["string"],
    "opportunities": ["string"]
  },
  "financials": {
    "funding_stage": "string",
    "total_funding": "string",
    "valuation": "string",
    "revenue_range": "string"
  },
  "products_services": [
    {
      "name": "string",
      "description": "string",
      "target_audience": "string"
    }
  ],
  "leadership": [
    {
      "name": "string",
      "title": "string",
      "background": "string"
    }
  ],
  "recent_developments": [
    {
      "date": "string",
      "event": "string",
      "impact": "string"
    }
  ],
  "data_source": "internal_database" | "web_research" | "hybrid",
  "analysis_confidence": "high" | "medium" | "low",
  "last_updated": "ISO_date_string"
}

### Analysis Guidelines:
- **Competitive Focus**: Always analyze from a competitor's perspective
- **Market Context**: Include industry positioning and market dynamics  
- **Data Quality**: Indicate confidence level and data sources
- **Actionable Insights**: Focus on intelligence that drives strategic decisions
- **Recent Information**: Prioritize current and relevant data

### Research Quality Standards:
- Verify information from multiple sources when possible
- Distinguish between confirmed facts and market speculation
- Highlight any data gaps or uncertainties
- Focus on publicly available information only

Return ONLY the structured JSON with no additional commentary or formatting.$$,
      'Vendor Analysis Agent',
      'Analyzes companies for competitive intelligence by first checking internal vendor database, then performing web research if needed. Returns structured JSON for theme creation.',
      'Competitive Intelligence Team',
      'Vendor Analysis System Prompt',
      'System prompt for comprehensive vendor and competitive analysis'
    );

    RAISE NOTICE 'Successfully inserted Vendor Analysis Agent with ID: %', insert_result;
    RETURN 'SUCCESS: Vendor Analysis Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$