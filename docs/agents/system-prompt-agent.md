# System Prompt Agent

**Created:** 2024-10-20  
**Last Updated:** 2024-12-31

## Overview

**Purpose**: The System Prompt Generator agent takes user queries, structures them into themes with social media posts, and creates comprehensive Visual System Prompts. These system prompts enable downstream agents to convert post titles and descriptions into detailed image generation prompts. Uses hard-coded templates for enhanced reliability and performance, with theme-first organization and integrated color theme support for visual consistency.

**Role**: Core agent that creates comprehensive system prompts by filling template placeholders with theme and category-specific content, integrating with the latest OpenAI models and maintaining centralized prompt management.

## Technical Specifications

### Model Configuration
```typescript
{
  model: "gpt-5-mini-2025-08-07", // Flagship GPT-4 model
  max_completion_tokens: 7000, // For comprehensive prompts
  // temperature: not supported in newer models
  deployment: "supabase-edge-function"
}
```

### Input Schema
```typescript
interface SystemPromptRequest {
  category: string;           // Target content category
  theme?: ColorTheme;        // Optional theme override  
  description?: string;      // Context description
  sample_posts?: Post[];     // Sample content for analysis
  user_id: string;          // User identification
}
```

### Output Schema
```typescript
interface SystemPromptResponse {
  success: boolean;
  system_prompt: string;
  agent_id: string;
  category: string;
  database_record_id: string;
  message: string;
}
```

## Core Functionality

### Prompt Generation Pipeline

1. **Context Analysis**: Analyzes input category and context
2. **Theme Integration**: Incorporates color themes and branding
3. **Prompt Construction**: Builds specialized prompts using GPT-4.1
4. **Agent Routing**: Determines target agent based on category
5. **Database Persistence**: Stores prompts with versioning
6. **Real-time Updates**: Broadcasts changes via WebSocket

### Agent Routing Logic

```typescript
const CATEGORY_ROUTING = {
  'healthcare': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'contracts': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'design': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'product_manager': AGENT_NAMES.COVER_LETTER_GENERATOR,
  'product_designer': AGENT_NAMES.COVER_LETTER_GENERATOR,
  'childrens_story': AGENT_NAMES.STORY_TELLING_AGENT,
  'convincing_story': AGENT_NAMES.STORY_TELLING_AGENT,
  'linkedin': AGENT_NAMES.SOCIAL_MEDIA_AGENT,
  'instagram': AGENT_NAMES.SOCIAL_MEDIA_AGENT,
  'twitter_x': AGENT_NAMES.SOCIAL_MEDIA_AGENT,
  // Default fallback: Visual Prompt Generator
};
```

## Database Integration

### Tables Used
- `system_prompts` - Generated prompt storage
- `openai_agents` - Target agent updates
- `color_themes` - Default theme integration
- `agent_categories` - Category configuration

### Key Operations
```sql
-- Store generated prompt
INSERT INTO system_prompts (
  category, prompt_text, agent_id, user_id, created_at
) VALUES ($1, $2, $3, $4, NOW());

-- Update target agent
UPDATE openai_agents 
SET system_prompts = jsonb_set(
  system_prompts, 
  '{-1}', 
  '{"category": $1, "prompt": $2}'
),
supported_categories = array_append(supported_categories, $1),
updated_at = NOW()
WHERE name = $3;
```

## Edge Function Implementation

### Endpoint
`supabase/functions/create-theme-system-prompt/index.ts`

### Key Functions
```typescript
// Fetch default color theme
async function getDefaultColorTheme() {
  const { data } = await supabase
    .from('color_themes')
    .select('*')
    .eq('is_default', true)
    .single();
  return data;
}

// Determine target agent
function getTargetAgent(category: string): string {
  return CATEGORY_ROUTING[category] || AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
}

// Generate system prompt
async function generatePrompt(context: PromptContext): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      { role: "system", content: PROMPT_GENERATOR_SYSTEM_PROMPT },
      { role: "user", content: buildPromptRequest(context) }
    ],
    max_completion_tokens: 15000
  });
  
  return response.choices[0].message.content;
}
```

## Integration Patterns

### Frontend Usage
```typescript
import { triggerSystemPromptGeneration } from '@/utils/systemPromptTrigger';

// Generate prompt for category
const result = await triggerSystemPromptGeneration('healthcare');

if (result.success) {
  toast.success('System prompt generated successfully');
} else {
  toast.error(`Generation failed: ${result.error}`);
}
```

### Real-time Updates
```typescript
// WebSocket subscription for prompt updates
const { data: systemPrompts } = useRealtimeSystemPrompts();

// React Query cache invalidation
queryClient.invalidateQueries(['system-prompts']);
```

## Performance Characteristics

### Metrics
- **Average Response Time**: 3-8 seconds
- **Success Rate**: >95% for valid inputs
- **Cache Duration**: 5 minutes with background refresh
- **Concurrent Limit**: 10 requests per user

### Optimization Features
- Intelligent caching with TTL
- Batch processing support
- Error retry with exponential backoff
- Performance monitoring and alerting

## Error Handling

### Common Errors
1. **OpenAI API Limits**: Rate limiting and quota management
2. **Database Timeouts**: Connection pooling optimization  
3. **Invalid Categories**: Validation and fallback handling
4. **Authentication Issues**: User permission verification

### Recovery Strategies
```typescript
// Retry with exponential backoff
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
```

## Monitoring & Analytics

### Key Metrics
- Generation success rate by category
- Average response time trends  
- Error categorization and frequency
- User engagement and satisfaction

### Alerting Thresholds
- Success rate < 90%
- Response time > 10 seconds
- Error rate > 5%
- API quota utilization > 80%

## Security Considerations

### Access Control
- User-scoped prompt access via RLS
- API key environment protection
- Input validation and sanitization
- Audit trail for all operations

### Data Protection
- Encrypted prompt storage
- Secure API key management
- User data isolation
- Compliance with privacy regulations

## Future Enhancements

### Planned Features
- Multi-model support (GPT-5, Claude, O3)
- Advanced prompt versioning
- A/B testing framework
- Custom model parameters per category

### Technical Improvements
- Database-driven category routing
- Prompt template inheritance system
- Enhanced performance monitoring
- Advanced error recovery mechanisms

---

**Related Documentation:**
- [Visual Prompt Generator](./visual-prompt-generator.md)
- [Blog Content Generator](./blog-content-generator.md) 
- [Agent Relationships](./agent-relationships.md)
- [Performance Monitoring](./performance-monitoring.md)
