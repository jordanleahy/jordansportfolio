# System Prompt Agent Documentation

## Agent Overview
**Name:** System Prompt Generator  
**Purpose:** Central orchestrator for generating specialized system prompts for different content categories and routing them to appropriate downstream agents

## Core Functionality

### Primary Role
- Generates context-aware system prompts using OpenAI GPT models
- Integrates default color themes and visual branding guidelines
- Routes generated prompts to specialized target agents based on category
- Maintains centralized system prompt storage and versioning

### Key Features
1. **Multi-Category Support**: Handles diverse content categories (healthcare, contracts, design, product management, etc.)
2. **Color Theme Integration**: Incorporates default color palettes and visual styling into prompts
3. **Intelligent Routing**: Automatically determines and updates target agents based on content type
4. **Database Persistence**: Stores all generated prompts with full attribution and versioning
5. **Real-time Updates**: Supports live prompt updates via WebSocket connections

## Technical Specifications

### Model Configuration
- **Default Model**: `gpt-4.1-2025-04-14` (Flagship)
- **Temperature**: `0.1` (Focused, consistent outputs)
- **Trigger Type**: API call via edge function
- **Input Source**: Category, theme, description, sample posts
- **Output Target**: System prompts table + target agent updates

### Input Parameters
```typescript
{
  category: string,        // Target content category
  theme?: string,         // Optional theme override
  description?: string,   // Context description
  sample_posts?: Array,   // Sample content for analysis
  user_id: string        // User identification
}
```

### Output Structure
```typescript
{
  success: boolean,
  system_prompt: string,
  agent_id: string,
  category: string,
  database_record_id: string,
  message: string
}
```

## Agent Routing Logic

### Target Agent Determination
- **Visual Content**: Routes to Visual Prompt Generator for healthcare, contracts, design, AI, product roles
- **Blog Content**: Routes to Blog Content Generator for content-focused categories
- **Cover Letters**: Routes to Cover Letter Generator for career-related content
- **Theme Processing**: Routes to Calendar Theme JSON Processor for calendar/theme work
- **Default Fallback**: Visual Prompt Generator for unrecognized categories

### Database Operations
1. **System Prompts Table**: Stores generated prompt with full metadata
2. **Agent Updates**: Updates target agent's `system_prompts` array and `supported_categories`
3. **Timestamp Tracking**: Updates `last_run` timestamps for auditing

## Integration Points

### Database Schema
- **Primary Table**: `system_prompts`
- **Agent Management**: `openai_agents`
- **Color Themes**: `color_themes` (default theme integration)

### Real-time Features
- WebSocket-based prompt updates
- Cache invalidation for React Query
- Toast notifications for user feedback

### Error Handling
- OpenAI API validation and retry logic
- Database transaction management
- Comprehensive logging and monitoring
- User-friendly error messages

## Usage Patterns

### Common Triggers
1. **Manual Generation**: Via Generate System Prompt button in UI
2. **Theme Import**: Automatic generation during theme processing
3. **Category Setup**: When new content categories are created
4. **Batch Operations**: Bulk regeneration for missing prompts

### Performance Characteristics
- **Average Response Time**: 2-5 seconds for prompt generation
- **Cache Strategy**: 5-minute cache with background updates
- **Rate Limiting**: Managed by OpenAI API constraints
- **Concurrent Handling**: Single-threaded with queue management

## Implementation Details

### Edge Function: `invoke-system-prompt-agent`
```typescript
// Main entry point for system prompt generation
// Location: supabase/functions/invoke-system-prompt-agent/index.ts
// Handles OpenAI API integration and agent routing
```

### Core Functions
1. **getDefaultColorTheme()**: Fetches default color palette from database
2. **Agent Selection Logic**: Determines target agent based on category mapping
3. **Prompt Construction**: Builds comprehensive prompts with context and themes
4. **Database Persistence**: Saves generated prompts with full metadata

### Category Mapping
```typescript
const CATEGORY_ROUTING = {
  'healthcare': 'Visual Prompt Generator',
  'contracts': 'Visual Prompt Generator', 
  'design': 'Visual Prompt Generator',
  'product_manager': 'Cover Letter Generator',
  'product_designer': 'Cover Letter Generator',
  'blog': 'Blog Content Generator',
  'theme_processing': 'Calendar Theme JSON Processor'
};
```

## Frontend Integration

### React Hooks
- `useSystemPromptCache`: Manages prompt caching and updates
- `useSystemPromptExists`: Checks for existing prompts by category
- `useRealtimeSystemPrompts`: Handles real-time prompt updates

### UI Components
- Generate System Prompt buttons in agent management interfaces
- Progress indicators for generation status
- Toast notifications for success/error states

## Monitoring and Maintenance

### Key Metrics
- Generation success rate (target: >95%)
- Average response time (target: <5 seconds)
- Error categorization and trending
- Usage patterns by category and user

### Maintenance Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update prompt templates and model configurations
- **Quarterly**: Color theme synchronization and cleanup
- **Annually**: Model version upgrades and architecture review

### Alerting
- OpenAI API failures
- Database connection issues
- Unusual error rate spikes
- Performance degradation alerts

## Security Considerations

### Access Control
- User-scoped prompt access via RLS policies
- API key environment protection
- Input sanitization and validation
- Audit trail maintenance for all operations

### Data Protection
- Encrypted storage of sensitive prompt data
- Secure API key management
- User data isolation
- Compliance with data retention policies

## Troubleshooting

### Common Issues
1. **OpenAI API Errors**: Check API key validity and quota limits
2. **Database Timeouts**: Review connection pooling and query optimization
3. **Cache Misses**: Verify React Query configuration and invalidation logic
4. **Routing Failures**: Ensure target agents exist and are properly configured

### Debug Procedures
1. Check edge function logs in Supabase dashboard
2. Verify user authentication and permissions
3. Review OpenAI API response status and error messages
4. Validate database schema and RLS policies

## Future Enhancements

### Planned Features
- Multi-model support (GPT-4, Claude, etc.)
- Prompt versioning and rollback capabilities
- A/B testing framework for prompt effectiveness
- Advanced analytics and usage insights

### Technical Debt
- Refactor category routing to use database configuration
- Implement prompt template inheritance
- Add support for custom model parameters per category
- Optimize database queries for better performance