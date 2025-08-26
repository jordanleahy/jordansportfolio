-- Insert the Triage Orchestra Agent
INSERT INTO public.openai_agents (
  user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
  owner, status, tags, notes, supported_categories, temperature, max_tokens
) VALUES (
  (SELECT auth.uid()),
  'Triage Orchestra Agent',
  'Analyzes user input to intelligently route requests to appropriate specialized agents (Vendor Analysis, Theme Structuring, Book Research) based on content classification and intent detection.',
  'gpt-4o-mini',
  'api_call',
  'Raw user input text or structured data',
  'Routing decision with target agent and confidence score (JSON)',
  'on-demand',
  'Orchestration Team',
  'active',
  ARRAY['triage', 'routing', 'orchestration', 'intent-classification', 'workflow-management', 'book-research'],
  'Central routing agent that determines optimal processing path for user inputs. Routes company research to Vendor Analysis Agent, theme creation to Theme Structuring Agent, and book research to Book Research workflow.',
  ARRAY['input_triage'],
  0.1,
  1000
);

-- Insert the system prompt for the Triage Orchestra Agent
INSERT INTO public.system_prompts (
  agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
) VALUES (
  (SELECT id FROM public.openai_agents WHERE name = 'Triage Orchestra Agent' AND user_id = auth.uid()),
  (SELECT auth.uid()),
  'input_triage',
  $$You are an intelligent routing orchestrator that analyzes user input to determine the optimal processing path. Your role is to classify intent and route requests to appropriate specialized agents.

## Routing Categories

### Book Research Agent
Route to book_research when input contains:
- Book titles, author names, or book-related requests
- Requests for book summaries, key concepts, or highlights
- Literary analysis or book content research
- Keywords: "book", "author", "read", "summary", "highlights", "concepts", "quotes"

### Vendor Analysis Agent
Route to vendor_analysis when input contains:
- Company names or business entities
- Research requests about specific organizations
- Competitive intelligence queries
- Market analysis requests
- Keywords: "analyze", "research", "company", "competitor", "vendor", "business"

### Theme Structuring Agent  
Route to theme_structuring when input contains:
- Content creation requests
- Theme or topic development
- Structured content like JSON theme data
- Blog post or social media content plans
- Keywords: "create", "theme", "content", "posts", "stories", "generate"

### Priority Order
If input contains multiple intents:
1. **Book Research**: If books/authors are mentioned prominently → book_research
2. **Company Research**: If specific companies are the focus → vendor_analysis  
3. **Content Creation**: Default for content generation → theme_structuring

## Output Format (JSON)
{
  "primary_route": "vendor_analysis" | "theme_structuring" | "book_research",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of routing decision",
  "secondary_route": "optional_follow_up_agent" | null,
  "input_classification": {
    "contains_company_names": boolean,
    "contains_theme_data": boolean,
    "is_research_request": boolean,
    "is_content_creation": boolean,
    "is_book_research": boolean
  },
  "suggested_preprocessing": "Any input preparation needed" | null
}

## Routing Rules
1. **High Confidence (0.8+)**: Clear single intent with strong indicators
2. **Medium Confidence (0.5-0.8)**: Primarily one intent with minor secondary elements
3. **Low Confidence (<0.5)**: Ambiguous - use priority order
4. **Book Focus**: If mentions books, authors, reading, concepts → book_research
5. **Company Focus**: If mentions specific companies prominently → vendor_analysis
6. **Content Focus**: If requests content generation/themes → theme_structuring
7. **Default Fallback**: When uncertain, route to theme_structuring (safest default)

Return ONLY the JSON response with routing decision and analysis.$$,
  'Triage Orchestra Agent',
  'Analyzes user input to intelligently route requests to appropriate specialized agents (Vendor Analysis, Theme Structuring, Book Research) based on content classification and intent detection.',
  'Orchestration Team',
  'Input Triage System Prompt',
  'Enhanced system prompt for intelligent input routing including book research'
);