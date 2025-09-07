# Bulk Prompt Generator Agent

**Version:** 1.0  
**Last Updated:** 2025-09-07  
**Audience:** Developers, AI Engineers

---

## Overview

**Purpose**: Efficient batch processing of image prompts for social media posts using optimized bulk operations.

**Role**: Transforms content descriptions into optimized visual prompts for AI image generators in batches, maximizing throughput and minimizing API calls.

## Technical Specifications

### Model Configuration
```typescript
{
  model: "gpt-4o-mini", // Optimized for speed and cost efficiency
  max_completion_tokens: 1000,
  temperature: 0.7, // Balanced creativity and consistency
  deployment: "supabase-edge-function"
}
```

### Input Schema
```typescript
interface BulkGeneratePromptsRequest {
  posts: Array<{
    id: string;
    title: string;
    description: string;
    day?: number;
  }>;
  theme_id: string;
  category: string;
  mode: 'all' | 'missing_only';
}
```

### Output Schema
```typescript
interface BulkGeneratePromptsResponse {
  success: boolean;
  results: Array<{
    post_id: string;
    success: boolean;
    prompt?: string;
    error?: string;
  }>;
  total_processed: number;
  successful: number;
  failed: number;
  processing_time_ms: number;
}
```

## Core Functionality

### Batch Processing Framework

#### Optimal Batch Size
```typescript
const BATCH_SIZE = 26; // Optimized for OpenAI rate limits and performance
```

#### Processing Pipeline
1. **Batch Formation**: Groups posts into optimal batch sizes
2. **Parallel Processing**: Processes multiple prompts simultaneously
3. **Error Resilience**: Continues processing on individual failures
4. **Database Updates**: Bulk updates for performance

### Prompt Generation Logic

#### Content Analysis
- **Theme Context**: Integrates theme category and description
- **Post Specificity**: Tailors prompts to individual post content
- **Visual Consistency**: Maintains brand and style consistency across posts
- **Aspect Ratio Optimization**: Optimizes prompts for target dimensions

#### System Prompt Integration
```typescript
// Retrieves appropriate system prompt based on category
const systemPrompt = await getSystemPromptForCategory(category);

// Generates contextual prompt with theme information
const contextualPrompt = buildContextualPrompt({
  theme_id,
  category,
  systemPrompt,
  posts
});
```

## Performance Optimizations

### Concurrency Control
- **Rate Limit Compliance**: Respects OpenAI API rate limits
- **Parallel Processing**: Processes batches concurrently when possible
- **Error Recovery**: Intelligent retry logic with exponential backoff

### Database Efficiency
```sql
-- Bulk update query for processed prompts
UPDATE social_media_posts 
SET 
  generated_image_prompt = data.prompt,
  individual_prompt_status = 'completed',
  updated_at = NOW()
FROM (VALUES 
  ('post-id-1', 'Generated prompt 1'),
  ('post-id-2', 'Generated prompt 2')
) AS data(id, prompt)
WHERE social_media_posts.id = data.id::uuid;
```

### Caching Strategy
- **System Prompt Caching**: Reduces repeated API calls for same category
- **Template Reuse**: Leverages successful prompt patterns
- **Result Memoization**: Caches results for identical content

## Integration Patterns

### Edge Function Integration
```typescript
// Called by ensure-post-image-prompts
export default async function bulkGeneratePrompts(req: Request) {
  const { posts, theme_id, category, mode } = await req.json();
  
  console.log(`🚀 Processing batch of ${posts.length} prompts for theme ${theme_id}`);
  
  const results = await processBatchPrompts(posts, category);
  await updatePostsWithPrompts(results);
  
  console.log(`✅ Batch complete: ${successCount} success, ${failCount} failed`);
  
  return new Response(JSON.stringify({
    success: true,
    results,
    total_processed: posts.length,
    successful: successCount,
    failed: failCount
  }));
}
```

### Frontend Integration
```typescript
// Usage through ensure-post-image-prompts trigger
const processTheme = async (themeId: string) => {
  const result = await supabase.functions.invoke('ensure-post-image-prompts', {
    body: { theme_id: themeId }
  });
  
  // bulk-generate-prompts is called automatically by ensure-post-image-prompts
};
```

## Error Handling & Recovery

### Resilience Patterns
- **Individual Failure Isolation**: Failed prompts don't stop batch processing
- **Partial Success Handling**: Processes successful prompts even with some failures
- **Retry Logic**: Automatic retry for transient failures
- **Graceful Degradation**: Fallback to simpler prompts when complex generation fails

### Error Categories
1. **API Errors**: Rate limits, network issues, model errors
2. **Content Errors**: Invalid input, moderation failures
3. **Database Errors**: Connection issues, constraint violations
4. **System Errors**: Memory limits, timeout issues

## Monitoring & Analytics

### Performance Metrics
- **Batch Processing Time**: Average time per batch
- **Success Rate**: Percentage of successful prompt generations
- **Throughput**: Posts processed per minute
- **Error Rate**: Categorized failure analysis

### Logging
```typescript
console.log('🚀 Processing batch of ${posts.length} prompts for theme ${theme_id}');
console.log('✅ Batch complete: ${successful} success, ${failed} failed');
```

## Quality Assurance

### Prompt Quality Validation
- **Content Relevance**: Ensures prompts match post content
- **Visual Coherence**: Maintains consistent visual style
- **Brand Compliance**: Adheres to category-specific guidelines
- **Technical Specifications**: Includes proper rendering instructions

### Success Criteria
- **Batch Completion Rate**: >95% successful batch processing
- **Prompt Quality Score**: >90% content relevance
- **Processing Speed**: <5 seconds per batch of 26 posts
- **Error Recovery**: <5% permanent failures

---

**Integration Notes:**
- Replaces deprecated `create-single-image-prompt` function
- Designed for bulk processing efficiency
- Integrates seamlessly with theme lifecycle management
- Supports real-time progress tracking through database updates

**Related Documentation:**
- [Theme Lifecycle Guide](../THEME_LIFECYCLE_GUIDE.md)
- [Edge Functions Reference](../EDGE_FUNCTIONS_REFERENCE.md)
- [Stories System Architecture](../STORIES_SYSTEM_ARCHITECTURE.md)