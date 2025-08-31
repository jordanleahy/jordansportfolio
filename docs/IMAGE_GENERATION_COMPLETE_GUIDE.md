# Image Generation Complete Guide

**Version:** 2.2  
**Last Updated:** 2025-08-31  
**Audience:** Developers, Engineers, Operations Team

---

## 🎯 Executive Summary

This comprehensive guide covers the complete image generation pipeline from user text input to final image output. It serves as both a developer implementation guide and security/operations manual, consolidating all aspects of single image, bulk generation, and manual upload workflows.

**Quick Navigation:**
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Complete Pipeline Flows](#-complete-pipeline-flows)
- [🤖 Agent Ecosystem](#-agent-ecosystem)
- [⚡ Edge Functions Reference](#-edge-functions-reference)
- [🎣 Frontend Hooks & Components](#-frontend-hooks--components)
- [🗄️ Database Schema & Storage](#️-database-schema--storage)
- [🛡️ Security & Hardening](#️-security--hardening)
- [💰 Usage Enforcement & Cost Controls](#-usage-enforcement--cost-controls)
- [🔍 Error Handling & Monitoring](#-error-handling--monitoring)
- [⚙️ Configuration & Settings](#️-configuration--settings)
- [🚨 Failure Modes & Recovery](#-failure-modes--recovery)
- [🧪 Testing & Validation](#-testing--validation)
- [🔧 Debugging & Troubleshooting](#-debugging--troubleshooting)

---

## 🏗️ System Architecture

### High-Level Architecture

<lov-mermaid>
graph TB
    subgraph "Frontend Layer"
        UI[User Interface] --> Hooks[React Hooks]
        Hooks --> Context[Processing Context]
        Context --> Components[UI Components]
    end
    
    subgraph "AI Agent Layer"
        SPA[System Prompt Agent] --> VPG[Visual Prompt Generator]
        VPG --> Models[OpenAI Models]
        SPA --> Cache[(Prompt Cache)]
    end
    
    subgraph "Edge Functions Layer"
        EF1[generate-image-gpt] --> EF2[generate-all-images-optimized]
        EF3[visual-prompt-generator] --> EF4[invoke-system-prompt-agent]
        EF5[generate-image-with-concurrency-control] --> EF6[user-idea-streaming-image-pipeline]
        EF7[check-usage-limits] --> EF8[send-usage-alert]
    end
    
    subgraph "Storage & Database"
        DB[(Supabase Database)] --> Storage[Supabase Storage]
        UsageDB[(Usage Tracking)] --> AlertSys[Alert System]
    end
    
    UI --> EF1
    SPA --> EF4
    VPG --> EF3
    EF1 --> DB
    EF2 --> Storage
    Models --> EF1
    EF7 --> UsageDB
    EF8 --> AlertSys
</lov-mermaid>

### Component Overview

| Layer | Components | Security Considerations |
|-------|------------|------------------------|
| **Frontend** | React Hooks, UI Components, Context | Client-side validation, no secrets exposure |
| **AI Agents** | System Prompt Agent, Visual Prompt Generator | Prompt injection prevention, content moderation |
| **Edge Functions** | 15+ specialized functions | Rate limiting, authentication, secret management |
| **Data Layer** | Supabase DB, Storage, Caching | RLS policies, encrypted storage, audit trails |

### Security Architecture

- **Authentication**: Supabase Auth with RLS enforcement
- **Authorization**: Row-level security on all user data
- **Secrets Management**: Server-side only via Supabase Edge Functions
- **Content Safety**: Prompt validation and moderation
- **Rate Limiting**: Multi-tier usage enforcement

---

## 🔄 Complete Pipeline Flows

### Flow 1: Single Image Generation

**Primary Entry Points:**
- `GenerateImage.tsx` - Primary image generation interface
- `SingleAspectRatioSelector.tsx` - Aspect-specific generation
- `useImageGeneration.ts` / `useImageManager.ts` - Hook orchestration

#### Phase 1: User Input & Validation

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

**Validation Steps:**
1. **Credit Check** (`useCreditCheck`)
   - Daily/monthly credit availability
   - User tier limitations
   - Cost calculations
2. **Usage Enforcement** (`useUsageEnforcement`)
   - Rate limiting per user
   - Concurrent generation limits
   - Alert thresholds (80% usage)

#### Phase 2: Content Processing & Prompt Generation

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

**Data Contracts:**
- **Prompt Request**: `{ title: string; description: string; category?: string; aspectRatio?: string; themeId?: string }`
- **Prompt Response**: `{ generatedPrompt: string; category: string; agent: string; correlationId: string }`

#### Phase 3: Image Generation & Processing

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

**Data Contracts:**
- **Image Request**: `{ prompt: string; aspectRatio: string; size?: string; quality?: string }`
- **Image Response**: `{ image: string(base64) or { data: string } }`
- **Post Update**: `{ image_16_9_url?: string; image_9_16_url?: string; individual_prompt_status?: string }`

#### Phase 4: Storage & Finalization

**Storage Flow:**
1. **Base64 Processing**: Convert OpenAI response to file
2. **Upload**: Store in appropriate Supabase bucket with deterministic path
3. **URL Generation**: Create public access URLs
4. **Database Update**: Update `social_media_posts` with URLs
5. **Watermarking**: Background processing for branding
6. **Cleanup**: Remove temporary files and data

### Flow 2: Bulk Image Generation

**Primary Entry Points:**
- `BulkImageGenerationButton.tsx` - Bulk processing interface
- `useBulkImageGeneration.ts` - Multi-aspect orchestration
- `useBulkSingleAspectGeneration.ts` - Single aspect optimization

#### Bulk Generation Sequence

<lov-mermaid>
sequenceDiagram
    autonumber
    participant User
    participant UI as FE UI (Bulk Button)
    participant CC as useCreditCheck
    participant UE as useUsageEnforcement
    participant SB as Supabase Functions
    participant DB as cached_prompts
    participant ST as Storage
    participant POSTS as DB (social_media_posts)

    User->>UI: Click Bulk Generate
    UI->>CC: getCreditStatus()
    CC-->>UI: status
    alt No credits
        UI-->>User: Toast: No credits
    else Has credits
        UI->>CC: enforceUsage('image_generation', 4)
        CC->>UE: checkAndEnforceUsage()
        UE->>SB: invoke('check-usage-limits')
        SB-->>UE: {allowed}
        alt Not allowed
            UI-->>User: Toast: limit exceeded
        else Allowed
            UI->>DB: get cached prompt
            DB-->>UI: hit/miss
            alt Miss
                UI->>SB: invoke('visual-prompt-generator')
                SB-->>UI: {generatedPrompt}
                UI->>DB: upsert cached_prompts
            end
            UI->>SB: invoke('generate-all-images-optimized')
            SB-->>UI: stream/progress/results
            loop For each aspect
                UI->>ST: Upload image
                ST-->>UI: {publicUrl}
                UI->>POSTS: Update image URL + status
                POSTS-->>UI: OK
            end
            UI-->>User: Toast: Bulk complete
        end
    end
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

3. **Streaming Pipeline** (`user-idea-streaming-image-pipeline`)
   - Real-time generation updates via SSE
   - Progress streaming for long-running jobs
   - Error recovery and continuation

### Flow 3: Manual/Alternative Upload Paths

**Entry Points:**
- `GenerateImage.tsx` + `imageUpload` / `storageImageUpload`

**Simple Flow:**
1. User selects/inputs an image
2. Upload to Storage with deterministic path and content-type
3. Update post's image URL and status fields
4. Optional: client-side watermark generation + upload
5. UI toasts and state updates

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
        IEA[Image Enhancement Agent]
    end
    
    subgraph "Support Systems"
        Cache[(Prompt Cache)]
        Routes[Agent Routing Logic]
        Deps[Dependency Management]
        Monitor[Agent Monitoring]
    end
    
    SPA --> VPG
    SPA --> BCG
    SPA --> CLG
    SPA --> CTP
    SPA --> IEA
    SPA --> Routes
    Routes --> Cache
    VPG --> Cache
    Deps --> SPA
    Monitor --> SPA
    Monitor --> VPG
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

**Security Considerations:**
- Input validation and sanitization
- Prompt injection prevention
- Category-based access controls

**Query Patterns:**
```typescript
// Theme-specific prompts
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('theme_id', themeId)
  .single();

// Agent-specific prompts  
const { data } = await supabase
  .from('system_prompts')
  .select('prompt_text')
  .eq('agent_id', agentId)
  .single();
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

**Security Features:**
- Content safety filtering
- Prompt length validation
- Malicious content detection

---

## ⚡ Edge Functions Reference

### Core Image Generation Functions

| Function | Purpose | Input | Output | Security Level |
|----------|---------|--------|--------|----------------|
| `generate-image-gpt` | Single image generation | Prompt, aspect ratio, config | Base64 image data | JWT Required |
| `generate-all-images-optimized` | Bulk multi-aspect generation | Post IDs, config | Batch results | JWT Required |
| `generate-image-with-concurrency-control` | Controlled single generation | Post data, options | Generation result | JWT Required |
| `user-idea-streaming-image-pipeline` | Real-time streaming generation | Stream config | SSE stream | JWT Required |

### Content Processing Functions

| Function | Purpose | Input | Output | Security Level |
|----------|---------|--------|--------|----------------|
| `visual-prompt-generator` | Image prompt creation | Content, theme, config | Optimized prompt | JWT Required |
| `invoke-system-prompt-agent` | System prompt routing | Category, context | System prompt | JWT Required |

### Utility Functions

| Function | Purpose | Input | Output | Security Level |
|----------|---------|--------|--------|----------------|
| `check-usage-limits` | Usage validation | User ID, operation | Limit status | JWT Required |
| `get-usage-summary` | Usage reporting | User ID, period | Usage statistics | JWT Required |
| `send-usage-alert` | Limit notifications | User ID, threshold | Alert result | Service Role |

### Security Headers

All Edge Functions implement CORS with these headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

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

**Security Features:**
- Client-side rate limiting
- Duplicate request prevention
- Error boundary integration

```typescript
const { generateImage, isGenerating, canGenerateImage } = useConcurrencyControlledImageGeneration();

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

**Security Features:**
- Bulk operation limits
- Progressive enhancement
- Graceful degradation

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
- Security: Input validation, file type checking

#### `SingleAspectRatioSelector.tsx`
**Aspect-specific generation controls**
- Individual aspect ratio generation
- Real-time status checking
- Visual progress indicators
- Security: Rate limiting display, quota warnings

#### `BulkImageGenerationButton.tsx`
**Bulk processing interface**
- Batch operation controls
- Progress tracking and cancellation
- Results summary and error reporting
- Security: Bulk operation limits, cost warnings

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
  
  // Security helpers
  canStartOperation: (postId: string, operation: string) => boolean;
  getRemainingQuota: (userId: string) => Promise<number>;
}
```

---

## 🗄️ Database Schema & Storage

### Core Tables

#### `social_media_posts`
**Primary content and image storage**

| Field | Type | Purpose | Security |
|-------|------|---------|----------|
| `id` | UUID | Primary key | Public |
| `user_id` | UUID | Owner reference | RLS Protected |
| `title` | TEXT | Post title | User Content |
| `content` | TEXT | Post content | User Content |
| `generated_image_prompt` | TEXT | AI-generated prompt | Generated |
| `image_1_1`, `image_16_9`, etc. | TEXT | Image URLs by aspect ratio | Public URLs |
| `image_1_1_status`, etc. | TEXT | Generation status per aspect | Process State |
| `theme_id` | UUID | Associated theme | Foreign Key |
| `category` | TEXT | Content category | Classification |
| `created_at` | TIMESTAMPTZ | Creation time | Audit |
| `updated_at` | TIMESTAMPTZ | Last modification | Audit |

**Status Values:**
- `none` - No image generated
- `pending` - Generation queued
- `generating` - Currently processing
- `completed` - Successfully generated
- `failed` - Generation failed
- `error` - System error occurred

**RLS Policies:**
```sql
-- Users can only access their own posts
CREATE POLICY "Users can view own posts" ON social_media_posts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own posts" ON social_media_posts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts" ON social_media_posts
FOR UPDATE USING (user_id = auth.uid());
```

#### `cached_prompts`
**Prompt caching for performance**

| Field | Type | Purpose | Security |
|-------|------|---------|----------|
| `id` | UUID | Primary key | Public |
| `cache_key` | TEXT | Unique identifier | Hashed |
| `prompt_text` | TEXT | Generated prompt | Generated Content |
| `category` | TEXT | Content category | Classification |
| `theme_id` | UUID | Associated theme | Foreign Key |
| `expires_at` | TIMESTAMPTZ | Cache expiration | TTL |
| `created_at` | TIMESTAMPTZ | Creation time | Audit |

**Cache Key Format:**
```
{sanitized_title}_{sanitized_description}_{theme_id}_{category}_{context_hash}
```

#### `api_usage_tracking`
**Usage monitoring and enforcement**

| Field | Type | Purpose | Security |
|-------|------|---------|----------|
| `id` | UUID | Primary key | Public |
| `user_id` | UUID | User reference | RLS Protected |
| `operation_type` | TEXT | Type of operation | Classification |
| `cost` | DECIMAL | Operation cost | Billing |
| `tokens_used` | INTEGER | Token consumption | Metrics |
| `success` | BOOLEAN | Operation success | Status |
| `created_at` | TIMESTAMPTZ | Timestamp | Audit |

#### `system_prompts`
**Agent prompt management**

| Field | Type | Purpose | Security |
|-------|------|---------|----------|
| `id` | UUID | Primary key | Public |
| `agent_id` | TEXT | Agent identifier | Classification |
| `theme_id` | UUID | Theme reference | Foreign Key |
| `prompt_text` | TEXT | System prompt | Generated Content |
| `is_active` | BOOLEAN | Active status | State |
| `created_at` | TIMESTAMPTZ | Creation time | Audit |

### Storage Configuration

#### Buckets

| Bucket | Public | Purpose | Security Policy |
|--------|--------|---------|-----------------|
| `hero-parallax` | true | Hero images | Public read, auth write |
| `post-images` | true | Social media posts | Public read, auth write |
| `user-uploads` | false | User content | User-specific access |
| `watermarked` | true | Branded images | Public read, service write |

#### File Path Structure
```
images/{user_id}/{post_id}/{aspect_ratio}/{timestamp}.{ext}
```

**Security Features:**
- User isolation via path structure
- Content-type validation
- File size limits
- Malware scanning (future)

#### Storage Policies

```sql
-- Public read for images
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id IN ('hero-parallax', 'post-images', 'watermarked'));

-- Users can upload their own images
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('hero-parallax', 'post-images') AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🛡️ Security & Hardening

### Authentication & Authorization

**Authentication Flow:**
1. Supabase Auth integration
2. JWT token validation
3. Session management
4. Automatic renewal

**Authorization Layers:**
1. **API Level**: Edge Function JWT verification
2. **Database Level**: Row Level Security (RLS)
3. **Storage Level**: Bucket policies
4. **Application Level**: Role-based access

### Row Level Security (RLS)

**Critical Policies:**
```sql
-- Ensure users only access their data
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_prompts ENABLE ROW LEVEL SECURITY;

-- Posts access
CREATE POLICY "posts_user_access" ON social_media_posts
USING (user_id = auth.uid());

-- Usage tracking access
CREATE POLICY "usage_user_access" ON api_usage_tracking
USING (user_id = auth.uid());
```

### Content Safety & Validation

**Input Validation:**
- Prompt length limits (4000 chars max)
- Content type validation
- File size restrictions
- Malicious content detection

**Output Validation:**
- Generated content review
- Image content analysis
- URL validation
- File integrity checks

### Secrets Management

**Edge Function Secrets:**
- OpenAI API keys (server-side only)
- Database connection strings
- Storage access tokens
- Third-party service keys

**Security Practices:**
- No secrets in client code
- Environment-based configuration
- Regular key rotation
- Access logging and monitoring

### Rate Limiting & Abuse Prevention

**Multi-tier Limits:**
```typescript
const RATE_LIMITS = {
  // Per-user limits
  DAILY_IMAGES: 50,
  MONTHLY_IMAGES: 1000,
  CONCURRENT_GENERATIONS: 3,
  
  // Global limits
  HOURLY_REQUESTS: 10000,
  BURST_CAPACITY: 100
};
```

**Abuse Detection:**
- Unusual usage patterns
- Rapid-fire requests
- Large batch operations
- Suspicious content patterns

### Compliance & Audit

**Audit Logging:**
- All user actions
- System operations
- Error conditions
- Performance metrics

**Data Protection:**
- GDPR compliance
- Data retention policies
- Right to deletion
- Export capabilities

---

## 💰 Usage Enforcement & Cost Controls

### Credit System

**Credit Tiers:**
```typescript
const CREDIT_TIERS = {
  FREE: {
    daily: 10,
    monthly: 200,
    imageGeneration: 1
  },
  PRO: {
    daily: 100,
    monthly: 2000,
    imageGeneration: 1
  },
  ENTERPRISE: {
    daily: 1000,
    monthly: 20000,
    imageGeneration: 1
  }
};
```

### Usage Monitoring

**Tracking Points:**
- Image generation requests
- Prompt generation calls
- Storage operations
- API calls to external services

**Cost Calculation:**
```typescript
const OPERATION_COSTS = {
  IMAGE_GENERATION: 1,  // 1 credit per image
  BULK_GENERATION: 4,   // 4 credits for standard aspect ratios
  PROMPT_GENERATION: 0.1, // Fractional cost
  STORAGE_UPLOAD: 0.05    // Storage operations
};
```

### Enforcement Mechanisms

**Usage Limits:**
1. **Pre-flight Checks**: Before expensive operations
2. **Real-time Monitoring**: During operation execution
3. **Post-operation Tracking**: After completion
4. **Alert System**: At 80% usage threshold

**Implementation:**
```typescript
// Pre-flight usage check
const canProceed = await useCreditCheck.enforceUsage('image_generation', 1);
if (!canProceed) {
  toast.error('Usage limit exceeded');
  return;
}

// Track operation completion
await trackUsage({
  operation: 'image_generation',
  cost: 1,
  success: true
});
```

### Alert System

**Alert Thresholds:**
- 80% of daily limit
- 90% of monthly limit
- Approaching tier upgrade
- Unusual usage spikes

**Notification Channels:**
- In-app toasts
- Email alerts
- Dashboard warnings
- Admin notifications

---

## 🔍 Error Handling & Monitoring

### Error Classification

**Error Categories:**
```typescript
enum ErrorType {
  // User errors
  INSUFFICIENT_CREDITS = 'insufficient_credits',
  INVALID_INPUT = 'invalid_input',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // System errors
  SERVICE_UNAVAILABLE = 'service_unavailable',
  GENERATION_FAILED = 'generation_failed',
  STORAGE_ERROR = 'storage_error',
  
  // External errors
  OPENAI_ERROR = 'openai_error',
  NETWORK_ERROR = 'network_error'
}
```

### Error Handling Patterns

**Frontend Error Handling:**
```typescript
try {
  const result = await generateImage(post, options);
  toast.success('Image generated successfully');
} catch (error) {
  if (error.code === 'INSUFFICIENT_CREDITS') {
    toast.error('Not enough credits. Please upgrade your plan.');
  } else if (error.code === 'SERVICE_UNAVAILABLE') {
    toast.error('Service temporarily unavailable. Please try again.');
  } else {
    toast.error('An unexpected error occurred. Please contact support.');
  }
  console.error('Image generation failed:', error);
}
```

**Backend Error Handling:**
```typescript
// Edge Function error handling
try {
  const image = await generateImageWithOpenAI(prompt);
  return { success: true, image };
} catch (error) {
  console.error('Generation failed:', error);
  
  if (error.status === 429) {
    return { success: false, error: 'RATE_LIMITED', retryAfter: 60 };
  } else if (error.status >= 500) {
    return { success: false, error: 'SERVICE_UNAVAILABLE', retryable: true };
  } else {
    return { success: false, error: 'GENERATION_FAILED', retryable: false };
  }
}
```

### Monitoring & Observability

#### Key Metrics

**Performance Metrics:**
- Image generation latency (P50, P95, P99)
- Prompt generation time
- Upload duration
- End-to-end pipeline time

**Success Metrics:**
- Generation success rate
- Upload success rate
- User satisfaction scores
- Retry success rates

**Business Metrics:**
- Daily active users
- Images generated per user
- Credit consumption rates
- Conversion rates

#### Logging Strategy

**Structured Logging:**
```typescript
const logger = {
  info: (message: string, context: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      userId: context.userId,
      ...context
    }));
  },
  
  error: (message: string, error: Error, context: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      ...context
    }));
  }
};
```

**Correlation IDs:**
- Generated for each request
- Propagated through all operations
- Used for distributed tracing
- Included in all log entries

#### Alerting

**Critical Alerts:**
- Service downtime (> 5 minutes)
- Error rate spike (> 10%)
- Response time degradation (> 2x baseline)
- Credit system failures

**Warning Alerts:**
- High usage patterns
- Approaching rate limits
- Storage quota warnings
- Performance degradation

---

## ⚙️ Configuration & Settings

### OpenAI Configuration

**Model Settings:**
```typescript
const OPENAI_CONFIG = {
  MODELS: {
    IMAGE_GENERATION: 'gpt-image-1',
    PROMPT_GENERATION: 'gpt-5-2025-08-07',
    SYSTEM_PROMPTS: 'gpt-4.1-2025-04-14'
  },
  
  IMAGE_SETTINGS: {
    QUALITY: 'high',
    SIZES: {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1152x896',
      '3:4': '896x1152'
    },
    FORMAT: 'webp',
    MAX_RETRIES: 3
  },
  
  PROMPT_SETTINGS: {
    MAX_LENGTH: 4000,
    TEMPERATURE: 0.7,
    MAX_TOKENS: 500
  }
};
```

### Aspect Ratio Mappings

```typescript
const ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024, label: 'Square' },
  '16:9': { width: 1792, height: 1024, label: 'Landscape' },
  '9:16': { width: 1024, height: 1792, label: 'Portrait' },
  '4:3': { width: 1152, height: 896, label: 'Classic' },
  '3:4': { width: 896, height: 1152, label: 'Tall' }
};
```

### Usage Limits Configuration

```typescript
const USAGE_LIMITS = {
  FREE_TIER: {
    daily_images: 10,
    monthly_images: 200,
    concurrent_operations: 1,
    bulk_batch_size: 4
  },
  
  PRO_TIER: {
    daily_images: 100,
    monthly_images: 2000,
    concurrent_operations: 3,
    bulk_batch_size: 10
  },
  
  ENTERPRISE_TIER: {
    daily_images: 1000,
    monthly_images: 20000,
    concurrent_operations: 10,
    bulk_batch_size: 50
  }
};
```

### Timeout Configuration

```typescript
const TIMEOUTS = {
  IMAGE_GENERATION: 60000,    // 60 seconds
  PROMPT_GENERATION: 30000,   // 30 seconds
  UPLOAD_OPERATION: 45000,    // 45 seconds
  BULK_OPERATION: 300000,     // 5 minutes
  
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff
  MAX_RETRIES: 3
};
```

---

## 🚨 Failure Modes & Recovery

### Common Failure Scenarios

#### 1. OpenAI API Failures

**Scenario**: OpenAI service unavailable or rate limited

**Detection**:
- HTTP 429 (Rate Limited)
- HTTP 5xx (Server Error)
- Timeout errors
- Invalid API responses

**Recovery**:
```typescript
async function generateImageWithRetry(prompt: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImage(prompt);
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### 2. Storage Upload Failures

**Scenario**: Supabase Storage unavailable or quota exceeded

**Detection**:
- Upload timeout
- Storage quota errors
- Network connectivity issues
- Invalid file formats

**Recovery**:
- Retry with exponential backoff
- Fallback to alternative storage
- Queue for later processing
- User notification and manual retry

#### 3. Database Update Failures

**Scenario**: Database constraint violations or connectivity issues

**Detection**:
- Foreign key violations
- Unique constraint errors
- Connection timeouts
- RLS policy violations

**Recovery**:
- Transaction rollback
- Orphaned file cleanup
- User notification
- Admin alert for investigation

#### 4. Credit System Failures

**Scenario**: Usage tracking service unavailable

**Detection**:
- Function invocation errors
- Database connectivity issues
- Calculation errors

**Recovery**:
- Graceful degradation (allow operations)
- Queue operations for later tracking
- Admin notification
- Manual reconciliation

### Partial Failure Handling

**Bulk Operations**:
```typescript
async function handleBulkGeneration(posts: Post[]) {
  const results = [];
  const failures = [];
  
  for (const post of posts) {
    try {
      const result = await generateImage(post);
      results.push(result);
    } catch (error) {
      failures.push({ post, error });
      console.error(`Failed to generate image for post ${post.id}:`, error);
    }
  }
  
  // Report partial success
  if (results.length > 0) {
    toast.success(`Generated ${results.length} images successfully`);
  }
  
  if (failures.length > 0) {
    toast.warning(`${failures.length} images failed to generate`);
  }
  
  return { successes: results, failures };
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## 🧪 Testing & Validation

### Test Categories

#### Unit Tests
- **Hook Logic**: Credit checks, usage enforcement, state management
- **Utilities**: Image upload, prompt generation, data validation
- **Components**: User interactions, error handling, progress indicators

#### Integration Tests
- **API Integration**: Edge Function calls, database operations
- **Storage Integration**: File upload/download, URL generation
- **Authentication**: RLS enforcement, JWT validation

#### End-to-End Tests
- **User Flows**: Complete image generation workflows
- **Error Scenarios**: Failure recovery, partial operations
- **Performance**: Load testing, concurrent operations

### Test Implementation

**Hook Testing Example:**
```typescript
describe('useCreditCheck', () => {
  it('should enforce usage limits correctly', async () => {
    const { result } = renderHook(() => useCreditCheck());
    
    // Mock usage at 90% of limit
    mockUsageResponse({ used: 90, limit: 100 });
    
    const canProceed = await result.current.enforceUsage('image_generation', 15);
    
    expect(canProceed).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith('Usage limit exceeded');
  });
});
```

**Edge Function Testing:**
```typescript
describe('generate-image-gpt', () => {
  it('should generate image successfully', async () => {
    const response = await testFunction('generate-image-gpt', {
      prompt: 'A beautiful sunset',
      aspectRatio: '16:9'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.image).toMatch(/^data:image/);
  });
  
  it('should handle rate limiting', async () => {
    mockOpenAIResponse(429, 'Rate limited');
    
    const response = await testFunction('generate-image-gpt', {
      prompt: 'Test prompt'
    });
    
    expect(response.status).toBe(429);
    expect(response.data.error).toBe('RATE_LIMITED');
  });
});
```

### Performance Testing

**Load Testing Scenarios:**
- Concurrent single image generation
- Bulk operation stress testing
- Database connection pooling
- Storage bandwidth limits

**Performance Benchmarks:**
- Image generation: < 60 seconds P95
- Prompt generation: < 5 seconds P95
- Storage upload: < 10 seconds P95
- End-to-end: < 90 seconds P95

---

## 🔧 Debugging & Troubleshooting

### Frontend Debugging

#### Common Issues

**1. Image Generation Stuck**
```typescript
// Check processing state
const isProcessing = useProcessingStatesContext();
console.log('Current processing state:', isProcessing.getState());

// Check credit status
const creditStatus = useCreditCheck();
console.log('Credit status:', await creditStatus.getCreditStatus());
```

**2. Upload Failures**
```typescript
// Enable detailed logging
const uploadWithLogging = async (file: File) => {
  console.log('Starting upload:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  try {
    const result = await uploadImage(file);
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Upload failed:', {
      error: error.message,
      stack: error.stack,
      file: file.name
    });
    throw error;
  }
};
```

#### Developer Tools

**React Developer Tools:**
- Component state inspection
- Hook debugging
- Context value monitoring
- Performance profiling

**Network Tab:**
- Edge Function call monitoring
- Response time analysis
- Error response inspection
- Payload verification

### Backend Debugging

#### Edge Function Logs

**Accessing Logs:**
1. Supabase Dashboard → Functions
2. Select specific function
3. View real-time logs
4. Filter by error level

**Structured Logging:**
```typescript
const correlationId = crypto.randomUUID();

console.log(JSON.stringify({
  level: 'INFO',
  message: 'Image generation started',
  correlationId,
  userId: user.id,
  prompt: prompt.substring(0, 100),
  aspectRatio
}));
```

#### Database Debugging

**Query Performance:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check RLS policy performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM social_media_posts WHERE user_id = 'user-id';
```

**Index Analysis:**
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename = 'social_media_posts';
```

### Performance Debugging

#### Frontend Performance

**Bundle Analysis:**
```bash
npm run build -- --analyze
```

**Runtime Performance:**
```typescript
// Measure hook performance
const usePerformanceMonitor = (hookName: string) => {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`${hookName} execution time:`, duration);
    };
  });
};
```

#### Backend Performance

**Function Execution Time:**
```typescript
const performanceWrapper = async (fn: Function, name: string) => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`${name} failed after ${duration}ms:`, error);
    throw error;
  }
};
```

### Troubleshooting Checklist

#### User Cannot Generate Images

1. **Check Credits**: Verify user has sufficient credits
2. **Check Limits**: Ensure within daily/monthly limits
3. **Check Status**: Verify no existing generation in progress
4. **Check Network**: Test API connectivity
5. **Check Permissions**: Verify RLS policies allow access

#### Images Not Appearing

1. **Check Storage**: Verify upload completed successfully
2. **Check URLs**: Ensure public URLs are valid
3. **Check Database**: Verify post record updated
4. **Check Caching**: Clear browser/CDN cache
5. **Check Permissions**: Verify storage bucket policies

#### Bulk Operations Failing

1. **Check Batch Size**: Ensure within limits
2. **Check Prompts**: Verify cached prompts valid
3. **Check Concurrency**: Monitor concurrent operations
4. **Check Memory**: Monitor function memory usage
5. **Check Timeouts**: Adjust timeout configurations

---

## 📚 Appendices

### A. Migration Notes

#### Recent Architecture Updates

**v2.1 → v2.2 Changes:**
- Consolidated documentation from separate pipeline and audit guides
- Enhanced security sections with specific RLS policies
- Added comprehensive error handling patterns
- Expanded monitoring and alerting guidance

#### Database Schema Evolution

**Theme System Migration:**
- **Before**: URL-based theme name resolution
- **After**: Database `theme_id` foreign key relationships
- **Migration Script**: Update all theme references to use UUID relationships

### B. Code Examples

#### Complete Hook Implementation

```typescript
// Example: Complete image generation hook with error handling
export const useImageGenerationComplete = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const creditCheck = useCreditCheck();
  
  const generateImage = async (post: Post, options: GenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      // Step 1: Credit check
      setProgress(10);
      const hasCredits = await creditCheck.enforceUsage('image_generation', 1);
      if (!hasCredits) {
        throw new Error('Insufficient credits');
      }
      
      // Step 2: Generate prompt
      setProgress(30);
      const promptResult = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          title: post.title,
          description: post.description,
          aspectRatio: options.aspectRatio,
          category: options.category
        }
      });
      
      if (promptResult.error) {
        throw new Error('Failed to generate prompt');
      }
      
      // Step 3: Generate image
      setProgress(60);
      const imageResult = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: promptResult.data.generatedPrompt,
          aspectRatio: options.aspectRatio,
          quality: 'high'
        }
      });
      
      if (imageResult.error) {
        throw new Error('Failed to generate image');
      }
      
      // Step 4: Upload to storage
      setProgress(80);
      const file = base64ToFile(imageResult.data.image, 'generated-image.webp');
      const uploadResult = await uploadImage(file, post.id, options.aspectRatio);
      
      // Step 5: Update database
      setProgress(90);
      const updateField = `image_${options.aspectRatio.replace(':', '_')}_url`;
      await supabase
        .from('social_media_posts')
        .update({ [updateField]: uploadResult.publicUrl })
        .eq('id', post.id);
      
      setProgress(100);
      toast.success('Image generated successfully');
      
      return { success: true, imageUrl: uploadResult.publicUrl };
      
    } catch (error) {
      setError(error.message);
      toast.error(`Generation failed: ${error.message}`);
      return { success: false, error: error.message };
      
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };
  
  return {
    generateImage,
    isGenerating,
    error,
    progress
  };
};
```

### C. Configuration Files

#### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration (Edge Functions only)
OPENAI_API_KEY=your-openai-key

# Feature Flags
VITE_ENABLE_BULK_GENERATION=true
VITE_ENABLE_WATERMARKING=true
VITE_MAX_CONCURRENT_GENERATIONS=3
```

#### Supabase Configuration

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54324
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://your-domain.com"]

[storage]
enabled = true
port = 54325
file_size_limit = "50MiB"
```

### D. Related Files Reference

**Frontend Components:**
- `src/components/stories/GenerateImage.tsx`
- `src/components/stories/SingleAspectRatioSelector.tsx`
- `src/components/stories/BulkImageGenerationButton.tsx`
- `src/components/stories/BulkGenerationThumbnails.tsx`

**Frontend Hooks:**
- `src/hooks/useImageGeneration.ts`
- `src/hooks/useImageManager.ts`
- `src/hooks/useBulkImageGeneration.ts`
- `src/hooks/useBulkSingleAspectGeneration.ts`
- `src/hooks/useConcurrencyControlledImageGeneration.ts`
- `src/hooks/useOptimizedImageGeneration.ts`
- `src/hooks/useUsageEnforcement.ts`
- `src/hooks/useCreditCheck.ts`

**Edge Functions:**
- `supabase/functions/visual-prompt-generator/`
- `supabase/functions/generate-image-gpt/`
- `supabase/functions/generate-image-with-concurrency-control/`
- `supabase/functions/generate-all-images-optimized/`
- `supabase/functions/user-idea-streaming-image-pipeline/`
- `supabase/functions/invoke-system-prompt-agent/`
- `supabase/functions/check-usage-limits/`
- `supabase/functions/get-usage-summary/`
- `supabase/functions/send-usage-alert/`

**Utilities:**
- `src/utils/imageUpload.ts`
- `src/utils/storageImageUpload.ts`

**Types:**
- `src/types/bulkImageGeneration.ts`
- `src/types/imagePromptGenerator.ts`

---

*This document serves as the definitive guide for the image generation system. For updates or questions, please contact the engineering team.*