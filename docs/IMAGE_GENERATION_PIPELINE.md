# Image Generation Pipeline - Complete Developer Guide

**Version:** 2.2  
**Last Updated:** 2025-08-30  
**Audience:** Developers, Engineers, Technical Team

> **🔄 Migration Update (2025-08-30):** Reverted to commit 76bb32c to restore legacy system prompt functions alongside modern theme-based approach. The system now operates in a hybrid state supporting both category-based and theme-based queries.

---

## 🎯 Executive Summary

This guide provides a comprehensive walkthrough of the complete image generation pipeline from user text input to final image output. It covers all components, data flows, and integration points across single image, bulk generation, and manual upload workflows.

**Quick Navigation:**
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Complete Pipeline Flow](#-complete-pipeline-flow)
- [🤖 Agent Ecosystem](#-agent-ecosystem)
- [⚡ Edge Functions Reference](#-edge-functions-reference)
- [🎣 Frontend Hooks & Components](#-frontend-hooks--components)
- [🗄️ Database Schema](#️-database-schema)
- [⚙️ Configuration & Settings](#️-configuration--settings)
- [🔍 Error Handling & Monitoring](#-error-handling--monitoring)

---

## 🏗️ System Architecture

<lov-mermaid>
graph TB
    subgraph "Frontend Layer"
        UI[User Interface] --> Hooks[React Hooks]
        Hooks --> Context[Processing Context]
    end
    
    subgraph "AI Agent Layer"
        SPA[System Prompt Agent] --> VPG[Visual Prompt Generator]
        VPG --> Models[OpenAI Models]
    end
    
    subgraph "Edge Functions Layer"
        EF1[generate-image-gpt] --> EF2[generate-all-images-optimized]
        EF3[visual-prompt-generator] --> EF4[invoke-system-prompt-agent]
        EF5[generate-image-with-concurrency-control]
    end
    
    subgraph "Storage & Database"
        DB[(Supabase Database)] --> Storage[Supabase Storage]
        Cache[(Cached Prompts)]
        Usage[(Usage Tracking)]
    end
    
    UI --> EF1
    SPA --> EF4
    VPG --> EF3
    EF1 --> DB
    EF2 --> Storage
    Models --> EF1
</lov-mermaid>

### Key Components Overview

| Layer | Components | Purpose |
|-------|------------|---------|
| **Frontend** | React Hooks, UI Components, Context | User interaction & state management |
| **AI Agents** | System Prompt Agent, Visual Prompt Generator | Content processing & prompt optimization |
| **Edge Functions** | 15+ specialized functions | Backend processing & API orchestration |
| **Data Layer** | Supabase DB, Storage, Caching | Persistence & file management |

---

## 🔄 Complete Pipeline Flow

### Phase 1: User Input & Validation

<lov-mermaid>
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant Credit as Credit Check
    participant Usage as Usage Enforcement
    
    User->>UI: Enter text/content
    UI->>Credit: Check credit status
    Credit-->>UI: Credits available/blocked
    UI->>Usage: Validate usage limits
    Usage-->>UI: Within limits/blocked
    
    alt Credits & Usage OK
        UI->>UI: Proceed to generation
    else Blocked
        UI->>User: Show limitation toast
    end
</lov-mermaid>

**Entry Points:**
- `GenerateImage.tsx` - Primary image generation interface
- `SingleAspectRatioSelector.tsx` - Aspect-specific generation
- `BulkImageGenerationButton.tsx` - Bulk processing interface

**Validation Steps:**
1. **Credit Check** (`useCreditCheck`)
   - Daily/monthly credit availability
   - User tier limitations
   - Cost calculations
2. **Usage Enforcement** (`useUsageEnforcement`)
   - Rate limiting
   - Concurrent generation limits
   - Alert thresholds (80% usage)

### Phase 2: Content Processing & Prompt Generation

<lov-mermaid>
sequenceDiagram
    participant UI as Frontend
    participant SPA as System Prompt Agent
    participant VPG as Visual Prompt Generator
    participant Cache as Prompt Cache
    participant OpenAI as OpenAI API
    
    UI->>SPA: Request system prompt
    SPA->>Cache: Check cached prompt
    
    alt Cache Hit
        Cache-->>SPA: Return cached prompt
    else Cache Miss
        SPA->>OpenAI: Generate system prompt
        OpenAI-->>SPA: Generated prompt
        SPA->>Cache: Store prompt
    end
    
    SPA-->>VPG: System prompt + context
    VPG->>OpenAI: Generate visual prompt
    OpenAI-->>VPG: Optimized image prompt
    VPG-->>UI: Final generation prompt
</lov-mermaid>

**Key Agents:**

1. **System Prompt Agent** (`invoke-system-prompt-agent`)
   - Routes content to appropriate agents
   - Generates category-specific system prompts
   - Updates agent relationships and dependencies

2. **Visual Prompt Generator** (`visual-prompt-generator`)
   - Creates optimized image generation prompts
   - Handles reference image analysis
   - Applies style and composition guidelines

**Caching Strategy:**
- **Prompt Caching**: `cached_prompts` table with category-based keys
- **Cache Invalidation**: Time-based and content-based expiration
- **Performance**: 80%+ cache hit rate for common themes

### Phase 3: Image Generation & Processing

<lov-mermaid>
sequenceDiagram
    participant Hook as React Hook
    participant EF as Edge Function
    participant OpenAI as OpenAI Image API  
    participant Storage as Supabase Storage
    participant DB as Database
    
    Hook->>EF: Generate image request
    EF->>OpenAI: Image generation API call
    OpenAI-->>EF: Base64 image data
    EF->>Storage: Upload to storage bucket
    Storage-->>EF: Public URL
    EF->>DB: Update post with image URL
    EF-->>Hook: Success response
    Hook->>Hook: Update UI state
</lov-mermaid>

**Generation Modes:**

1. **Single Image** (`useConcurrencyControlledImageGeneration`)
   - Per-aspect ratio generation
   - Concurrency control to prevent duplicates
   - Real-time status updates

2. **Bulk Generation** (`useBulkSingleAspectGeneration`, `useBulkImageGeneration`)
   - Batch processing with progress tracking
   - Multiple aspect ratios simultaneously
   - Intelligent retry logic

3. **Streaming Pipeline** (`streaming-image-pipeline`)
   - Real-time generation updates via SSE
   - Progress streaming for long-running jobs
   - Error recovery and continuation

### Phase 4: Storage & Finalization

**Storage Flow:**
1. **Base64 Processing**: Convert OpenAI response to file
2. **Upload**: Store in appropriate Supabase bucket
3. **URL Generation**: Create public access URLs
4. **Database Update**: Update `social_media_posts` with URLs
5. **Watermarking**: Background processing for branding
6. **Cleanup**: Remove temporary files and data

---

## 🤖 Agent Ecosystem

### Agent Hierarchy & Relationships

<lov-mermaid>
graph TD
    subgraph "Core Agents"
        SPA[System Prompt Agent<br/>Central Orchestrator]
        VPG[Visual Prompt Generator<br/>Image Optimization]
    end
    
    subgraph "Specialized Agents"
        BCG[Blog Content Generator]
        CLG[Cover Letter Generator] 
        CTP[Calendar Theme Processor]
    end
    
    subgraph "Support Systems"
        Cache[(Prompt Cache)]
        Routes[Agent Routing Logic]
        Deps[Dependency Management]
    end
    
    SPA --> VPG
    SPA --> BCG
    SPA --> CLG
    SPA --> CTP
    SPA --> Routes
    Routes --> Cache
    VPG --> Cache
    Deps --> SPA
</lov-mermaid>

### System Prompt Agent

**Primary Functions:**
- **Content Routing**: Determines appropriate agent based on content category
- **Prompt Generation**: Creates specialized system prompts for downstream agents
- **Agent Management**: Updates agent configurations and supported categories
- **Quality Control**: Ensures prompt consistency and effectiveness

**Categories Handled:**
- `healthcare`, `contracts`, `design`, `marketing`, `education`
- `visual_content`, `blog_content`, `cover_letters`
- Dynamic category mapping and routing

**Query Patterns:**
- **Modern Approach**: Query `system_prompts` using `theme_id` foreign key
- **Legacy Approach**: Query `system_prompts` using `theme` field (category name)
- **Agent-based**: Query `system_prompts` using `agent_id` foreign key
- **Category Logic**: Categories stored in `themes` table for modern approach

**Implementation:**
```typescript
// Edge Function: invoke-system-prompt-agent
export interface SystemPromptRequest {
  themeId?: string;        // Modern: Query by theme relationship
  agentId?: string;        // Alternative: Query by agent relationship
  category?: string;       // Legacy: Category name for backward compatibility
  theme?: string;          // Legacy: Theme name for category lookup
  title?: string;
  description?: string;
}

// Query Pattern Examples:
// 1. Modern: Theme-specific prompts
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('theme_id', themeId)
  .single();

// 2. Legacy: Category-based prompts
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('theme', category)  // Uses legacy theme field
  .single();

// 3. Agent-specific prompts  
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('agent_id', agentId)
  .single();
```

### Legacy System Prompt Functions (Restored 2025-08-30)

**Available Utility Functions:**
- `triggerSystemPromptGeneration(category)`: Generate system prompt for a specific category
- `triggerMissingSystemPrompts()`: Batch generate prompts for categories missing them
- `regenerateAllSystemPrompts()`: Console utility for bulk regeneration

**Usage Examples:**
```typescript
// 1. Generate for specific category
import { triggerSystemPromptGeneration } from '@/utils/systemPromptTrigger';
const result = await triggerSystemPromptGeneration('healthcare');

// 2. Browser console utility (available globally)
regenerateSystemPrompts(); // Processes all missing categories

// 3. Programmatic batch processing
import { triggerMissingSystemPrompts } from '@/utils/systemPromptTrigger';
const results = await triggerMissingSystemPrompts();
```

### Visual Prompt Generator

**Primary Functions:**
- **Image Prompt Optimization**: Converts text content to visual prompts
- **Reference Analysis**: Analyzes existing images for style consistency
- **Style Application**: Applies brand guidelines and visual standards
- **Aspect Ratio Optimization**: Tailors prompts for specific dimensions

**Advanced Features:**
- **Style Extraction**: Analyzes reference images for color, composition, lighting
- **Brand Consistency**: Maintains visual identity across generations
- **Quality Scoring**: Evaluates and improves prompt effectiveness

**Configuration Options:**
```typescript
export interface VisualPromptConfig {
  aspectRatio: AspectRatio;
  style?: 'professional' | 'creative' | 'minimal';
  industry?: string;
  brandGuidelines?: BrandConfig;
  referenceImages?: string[];
}
```

---

## ⚡ Edge Functions Reference

### Core Image Generation Functions

| Function | Purpose | Input | Output |
|----------|---------|--------|--------|
| `generate-image-gpt` | Single image generation | Prompt, aspect ratio, config | Base64 image data |
| `generate-all-images-optimized` | Bulk multi-aspect generation | Post IDs, config | Batch results |
| `generate-image-with-concurrency-control` | Controlled single generation | Post data, options | Generation result |
| `streaming-image-pipeline` | Real-time streaming generation | Stream config | SSE stream |

### Content Processing Functions

| Function | Purpose | Input | Output |
|----------|---------|--------|--------|
| `visual-prompt-generator` | Image prompt creation | Content, theme, config | Optimized prompt |
| `invoke-system-prompt-agent` | System prompt routing | Category, context | System prompt |
| `generate-image-prompt-dynamic` | Dynamic prompt generation | Post content | Generation prompt |

### Utility Functions

| Function | Purpose | Input | Output |
|----------|---------|--------|--------|
| `check-usage-limits` | Usage validation | User ID, operation | Limit status |
| `get-usage-summary` | Usage reporting | User ID, period | Usage statistics |
| `send-usage-alert` | Limit notifications | User ID, threshold | Alert result |

### Function Usage Patterns

**Single Image Generation:**
```typescript
// 1. Credit check
const credits = await useCreditCheck.getCreditStatus();

// 2. Generate image
const result = await supabase.functions.invoke('generate-image-gpt', {
  body: {
    prompt: visualPrompt,
    aspectRatio: '16:9',
    quality: 'high'
  }
});

// 3. Process result
if (result.data?.success) {
  // Handle success
}
```

**Bulk Generation:**
```typescript
// 1. Setup bulk job
const posts = await getBulkPosts();

// 2. Process batch
const results = await supabase.functions.invoke('generate-all-images-optimized', {
  body: {
    posts: posts.map(p => ({ id: p.id, prompt: p.generated_image_prompt })),
    aspectRatios: ['1:1', '16:9', '9:16'],
    mode: 'missing_only'
  }
});

// 3. Track progress
results.data?.forEach(result => {
  // Update UI with individual results
});
```

---

## 🎣 Frontend Hooks & Components

### Core Hooks

#### `useConcurrencyControlledImageGeneration`
**Purpose:** Single image generation with duplicate prevention
**Key Features:**
- Prevents concurrent generation of same image
- Status checking and validation
- Real-time progress updates

```typescript
const { generateImage, isGenerating, canGenerateImage } = useConcurrencyControlledImageGeneration();

// Usage
const result = await generateImage(post, {
  aspectRatio: '16:9',
  useDeterministicSeed: true,
  category: 'healthcare'
});
```

#### `useBulkImageGeneration`
**Purpose:** Multi-aspect ratio bulk generation
**Key Features:**
- Batch processing with progress tracking
- Intelligent retry logic
- Cost estimation and validation

```typescript
const { generateAllImages, isGenerating, progress } = useBulkImageGeneration();

// Usage
const results = await generateAllImages(posts, {
  aspectRatios: ['1:1', '16:9', '9:16'],
  mode: 'missing_only'
});
```

#### `useBulkSingleAspectGeneration`
**Purpose:** Single aspect ratio bulk processing
**Key Features:**
- Single aspect optimization
- Mode selection (missing_only, regenerate_all)
- Enhanced performance for targeted generation

#### `useImageManager`
**Purpose:** General image management and coordination
**Key Features:**
- Upload handling
- Processing state management
- Post updates and synchronization

### UI Components

#### `GenerateImage.tsx`
**Primary image generation interface**
- Manual upload and AI generation options
- Progress indicators and status updates
- Error handling and user feedback

#### `SingleAspectRatioSelector.tsx`
**Aspect-specific generation controls**
- Individual aspect ratio generation
- Real-time status checking
- Visual progress indicators

#### `BulkImageGenerationButton.tsx`
**Bulk processing interface**
- Batch operation controls
- Progress tracking and cancellation
- Results summary and error reporting

### Processing Context

```typescript
interface ProcessingStatesContextType {
  // Individual post processing states
  setProcessing: (postId: string, operation: string, isProcessing: boolean, aspectRatio?: AspectRatio) => void;
  
  // Bulk processing states
  setBulkProcessing: (postId: string, isProcessing: boolean) => void;
  
  // Status queries
  isProcessing: (postId: string, operation?: string, aspectRatio?: AspectRatio) => boolean;
  isBulkProcessing: (postId: string) => boolean;
}
```

---

## 🗄️ Database Schema

### Core Tables

#### `social_media_posts`
**Primary content and image storage**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `title` | TEXT | Post title |
| `content` | TEXT | Post content |
| `generated_image_prompt` | TEXT | AI-generated prompt |
| `image_1_1`, `image_16_9`, etc. | TEXT | Image URLs by aspect ratio |
| `image_1_1_status`, etc. | TEXT | Generation status per aspect |
| `theme_id` | UUID | Associated theme |
| `category` | TEXT | Content category |

**Status Values:**
- `none` - No image generated
- `pending` - Generation queued
- `generating` - Currently processing
- `completed` - Successfully generated
- `failed` - Generation failed
- `error` - System error occurred

#### `cached_prompts`
**Prompt caching for performance**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `cache_key` | TEXT | Unique cache identifier |
| `prompt_content` | TEXT | Cached prompt |
| `category` | TEXT | Content category |
| `theme_id` | UUID | Associated theme |
| `created_at` | TIMESTAMP | Cache creation time |
| `expires_at` | TIMESTAMP | Cache expiration |

**Cache Key Format:**
```
{function_name}:{category}:{theme_id}:{content_hash}
```

#### `api_usage_tracking`
**Usage monitoring and cost tracking**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User identifier |
| `function_name` | TEXT | Edge function called |
| `model` | TEXT | AI model used |
| `request_type` | TEXT | Operation type |
| `estimated_cost` | NUMERIC | Cost in credits |
| `success` | BOOLEAN | Success status |
| `created_at` | TIMESTAMP | Request timestamp |

#### `system_prompts`
**AI-generated system prompts with hybrid relationship support**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `prompt_text` | TEXT | Generated prompt content |
| `theme_id` | UUID | **Modern: Foreign key to themes** |
| `theme` | TEXT | **Legacy: Category name for backward compatibility** |
| `agent_id` | UUID | **Foreign key to openai_agents** |
| `category` | TEXT | **Legacy: Content category (deprecated)** |
| `user_id` | UUID | User identifier |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Migration Notes (2025-08-30):**
- **Modern queries** use `theme_id` foreign key relationships
- **Legacy queries** use `theme` field with category names
- Both approaches are currently supported for backward compatibility

#### `themes`
**Theme definitions and categories**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `theme_name` | TEXT | Theme display name |
| `category` | TEXT | **Content category** |
| `description` | TEXT | Theme description |
| `user_id` | UUID | User identifier |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `openai_agents`
**AI agent configurations**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `name` | TEXT | Agent name |
| `supported_categories` | TEXT[] | Categories handled by agent |
| `user_id` | UUID | User identifier |

### Migration History & Compatibility (2025-08-30)

**Timeline:**
1. **2025-08-24**: Attempted migration to pure theme-based relationships
2. **2025-08-30**: Reverted to hybrid approach supporting both patterns

**Current State (Post-Revert):**
The system now supports both modern and legacy query patterns:

```typescript
// ✅ Modern (Preferred): Query by theme relationship
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('theme_id', themeId);   // Uses foreign key

// ✅ Legacy (Supported): Query by category name
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('theme', category);     // Uses category name

// ✅ Agent-based: Query by agent relationship
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('agent_id', agentId);   // Uses agent foreign key
```

**Restored Legacy Functions:**
- `triggerSystemPromptGeneration()`: Category-based prompt generation
- `triggerMissingSystemPrompts()`: Batch processing for missing prompts
- `regenerateAllSystemPrompts()`: Console utility function

**Migration Recommendations:**
- New implementations should prefer `theme_id` relationships
- Legacy systems can continue using category names
- Both patterns will remain supported for stability

### Storage Buckets

#### Image Storage Configuration

| Bucket | Purpose | Public | RLS |
|--------|---------|--------|-----|
| `social-media-images` | Generated content images | Yes | Yes |
| `hero-parallax` | Hero/header images | Yes | Yes |
| `user-uploads` | Manual uploads | No | Yes |

**Storage Path Structure:**
```
/social-media-images/
  /{user_id}/
    /{post_id}/
      /1_1.jpg    # Square images
      /16_9.jpg   # Landscape images
      /9_16.jpg   # Portrait images
```

---

## ⚙️ Configuration & Settings

### OpenAI Model Configuration

```typescript
export const IMAGE_GENERATION_CONFIG = {
  MODELS: {
    FLAGSHIP: 'gpt-image-1',      // Primary model
    FALLBACK: 'dall-e-3',        // Backup model
    LEGACY: 'dall-e-2'           // Legacy support
  },
  
  QUALITY_SETTINGS: {
    HIGH: 'high',
    STANDARD: 'standard',
    AUTO: 'auto'
  },
  
  SIZE_OPTIONS: {
    SQUARE: '1024x1024',
    LANDSCAPE: '1792x1024', 
    PORTRAIT: '1024x1792'
  },
  
  TIMEOUTS: {
    GENERATION: 180000,      // 3 minutes
    BULK_OPERATION: 600000,  // 10 minutes
    STREAMING: 300000        // 5 minutes
  }
};
```

### Aspect Ratio Mappings

```typescript
export const ASPECT_RATIO_CONFIG = {
  '1:1': { width: 1024, height: 1024, name: 'Square' },
  '16:9': { width: 1792, height: 1024, name: 'Landscape' },
  '9:16': { width: 1024, height: 1792, name: 'Portrait' },
  '4:3': { width: 1536, height: 1024, name: 'Standard' },
  '3:4': { width: 1024, height: 1536, name: 'Vertical' }
};
```

### Usage Limits & Credits

```typescript
export const USAGE_LIMITS = {
  FREE_TIER: {
    DAILY_GENERATIONS: 10,
    MONTHLY_GENERATIONS: 100,
    CONCURRENT_LIMIT: 2
  },
  
  PRO_TIER: {
    DAILY_GENERATIONS: 500,
    MONTHLY_GENERATIONS: 5000,
    CONCURRENT_LIMIT: 10
  },
  
  ALERTS: {
    WARNING_THRESHOLD: 0.8,  // 80% usage
    CRITICAL_THRESHOLD: 0.95 // 95% usage
  }
};
```

---

## 🔍 Error Handling & Monitoring

### Common Error Scenarios

#### Generation Failures

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `INSUFFICIENT_CREDITS` | User out of credits | Upgrade plan or wait for reset |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff/retry |
| `CONTENT_POLICY_VIOLATION` | Prompt violates OpenAI policy | Modify prompt content |
| `TIMEOUT_ERROR` | Generation takes too long | Retry with simpler prompt |
| `STORAGE_ERROR` | File upload fails | Retry upload operation |

#### Monitoring & Logging

**Edge Function Logging:**
```typescript
// Correlation ID tracking
const correlationId = generateCorrelationId();
const logger = createLogger({ 
  functionName: 'generate-image-gpt', 
  correlationId 
});

// Success tracking
logger.info('Image generation started', { 
  postId, 
  aspectRatio, 
  promptLength: prompt.length 
});

// Error tracking
logger.error('Generation failed', { 
  error: error.message, 
  postId, 
  retryCount 
});
```

**Usage Tracking:**
```typescript
// Track all API calls
await trackOpenAIUsage({
  userId,
  functionName: 'generate-image-gpt',
  model: 'gpt-image-1',
  requestType: 'image_generation',
  estimatedCost: calculateCost(model, operation),
  success: true,
  metadata: { aspectRatio, quality }
});
```

### Performance Monitoring

**Key Metrics:**
- **Generation Success Rate**: Target >95%
- **Average Generation Time**: Target <30 seconds
- **Cache Hit Rate**: Target >80%
- **Error Rate**: Target <5%
- **User Satisfaction**: Based on retry rates

**Alerting Thresholds:**
- Generation failures >10% in 5 minutes
- Average response time >60 seconds
- Cache hit rate <70%
- Storage errors >5% in 10 minutes

### Debugging Guide

**Frontend Issues:**
1. Check browser console for React errors
2. Verify hook state management
3. Confirm API response handling
4. Test network connectivity

**Backend Issues:**
1. Check Edge Function logs in Supabase dashboard
2. Verify OpenAI API key configuration
3. Test database connectivity
4. Confirm storage bucket permissions

**Performance Issues:**
1. Monitor cache hit rates
2. Check concurrent generation limits
3. Analyze prompt optimization effectiveness
4. Review storage upload speeds

---

## 📚 Additional Resources

### Documentation Links
- [Technical Audit & Hardening Guide](./text-to-photos-audit-and-hardening.md)
- [System Prompt Agent Documentation](./agents/system-prompt-agent.MD)
- [Visual Prompt Generator Documentation](./agents/visual-prompt-generator.MD)
- [Blog Content Generator Documentation](./agents/blog-content-generator.MD)

### Code References
- Frontend Hooks: `src/hooks/use*ImageGeneration.ts`
- UI Components: `src/components/stories/`
- Edge Functions: `supabase/functions/`
- Database Schema: `supabase/migrations/`
- **Legacy Utilities**: `src/utils/systemPromptTrigger.ts`, `src/utils/runRegeneration.ts`
- **Modern System Prompts**: Theme-based queries via `triggerSystemPromptForNewTheme()`

### Support & Troubleshooting
- Edge Function Logs: Supabase Dashboard → Functions → Logs
- Database Monitoring: Supabase Dashboard → Database → Logs
- Usage Analytics: `api_usage_tracking` table
- Error Tracking: Application logs + Sentry integration

---

**Last Updated:** 2025-08-30  
**Version:** 2.2  
**Maintainer:** Engineering Team  
**Migration Status:** Hybrid system supporting both legacy category-based and modern theme-based approaches