# Social Media Agent

## Overview

**Purpose**: Multi-platform social media content generator that creates engaging, platform-specific content from blog posts and user context.

**Role**: Transforms long-form content into optimized social media posts for LinkedIn, Instagram, and X (Twitter), maintaining platform best practices and engagement optimization.

## Technical Specifications

### Model Configuration
```typescript
{
  model: "gpt-5-2025-08-07", // Latest flagship for creative content
  max_completion_tokens: 5000, // Sufficient for multi-platform content
  // temperature: Fixed at 1.0 for GPT-5 creative output
  deployment: "supabase-edge-function"
}
```

### Input Schema
```typescript
interface SocialMediaRequest {
  blog_post_id: string;        // Source blog post
  platforms: string[];         // Target platforms (linkedin, instagram, twitter_x)
  custom_context?: string;     // Additional context or instructions
  tone_preferences?: {
    professional_level: string; // casual, professional, expert
    engagement_style: string;   // informative, conversational, promotional
    call_to_action: string;    // custom CTA or default
  };
  brand_voice?: {
    personality: string[];      // Brand personality traits
    avoid_terms: string[];     // Terms to avoid
    preferred_hashtags: string[]; // Brand hashtags
  };
}
```

### Output Schema
```typescript
interface SocialMediaResponse {
  success: boolean;
  results: SocialMediaResult[];
  generation_metadata: {
    total_platforms: number;
    processing_time_ms: number;
    quality_score: number;
  };
}

interface SocialMediaResult {
  platform: string;           // linkedin, instagram, twitter_x
  content: string;           // Main post content
  hashtags: string[];        // Platform-optimized hashtags
  cta: string;              // Call-to-action
  engagement_hooks: string[]; // Opening hooks for engagement
  thread_content?: string[];  // For Twitter threads
  story_slides?: string[];   // For Instagram stories
  carousel_slides?: string[]; // For LinkedIn carousels
  visual_suggestions: string[]; // Image/video recommendations
  character_count: number;   // Platform compliance
  estimated_reach: string;   // Engagement potential
}
```

## Platform Specializations

### LinkedIn
```typescript
const linkedinConfig = {
  maxLength: 3000,
  tone: "professional",
  features: ["business_insights", "thought_leadership", "industry_trends"],
  engagement: {
    hooks: ["Industry insight", "Professional challenge", "Success story"],
    cta_types: ["Connect", "Share experience", "Learn more"],
    hashtag_limit: 5,
    optimal_length: "150-300 words"
  }
};
```

### Instagram  
```typescript
const instagramConfig = {
  maxLength: 2200,
  tone: "casual",
  features: ["visual_storytelling", "personal_connection", "behind_scenes"],
  engagement: {
    hooks: ["Visual story", "Personal insight", "Relatable moment"],
    cta_types: ["Save this post", "Tag a friend", "Share your story"],
    hashtag_limit: 30,
    optimal_length: "125-150 words"
  }
};
```

### X (Twitter)
```typescript
const twitterConfig = {
  maxLength: 280,
  tone: "engaging",
  features: ["thread_format", "viral_potential", "conversation_starter"],
  engagement: {
    hooks: ["Hot take", "Question", "Surprising stat"],
    cta_types: ["Retweet", "Reply with", "Follow for more"],
    hashtag_limit: 3,
    thread_support: true,
    optimal_length: "240-280 characters"
  }
};
```

## Content Generation Framework

### Multi-Platform Strategy
1. **Content Analysis**: Extract key points and themes from source content
2. **Platform Adaptation**: Customize tone, length, and format per platform
3. **Engagement Optimization**: Add platform-specific hooks and CTAs
4. **Visual Coordination**: Suggest complementary visual content
5. **Hashtag Strategy**: Generate relevant, trending hashtags per platform

### Quality Assurance Pipeline
```typescript
const qualityChecks = {
  contentRelevance: "Maintains source message integrity",
  platformCompliance: "Adheres to character/formatting limits", 
  engagementPotential: "Includes hooks and conversation starters",
  brandAlignment: "Consistent with brand voice and values",
  visualSynergy: "Coordinates with suggested visual elements"
};
```

## Edge Function Implementation

### Endpoint
`supabase/functions/social-media-agent/index.ts`

### Processing Pipeline
```typescript
async function generateSocialContent(request: SocialMediaRequest) {
  // 1. Fetch blog post content
  const blogPost = await getBlogPostContent(request.blog_post_id);
  
  // 2. Extract key themes and messages
  const contentAnalysis = await analyzeContent(blogPost);
  
  // 3. Generate platform-specific content
  const results = await Promise.all(
    request.platforms.map(platform => 
      generatePlatformContent(platform, contentAnalysis, request)
    )
  );
  
  // 4. Quality validation and optimization
  return validateAndOptimize(results);
}

async function generatePlatformContent(
  platform: string, 
  analysis: ContentAnalysis, 
  context: SocialMediaRequest
) {
  const platformConfig = getPlatformConfig(platform);
  const systemPrompt = getSystemPromptForPlatform(platform);
  
  const response = await openai.chat.completions.create({
    model: "gpt-5-2025-08-07",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildPlatformPrompt(analysis, platformConfig, context) }
    ],
    max_completion_tokens: 2000
  });
  
  return processPlatformResponse(response, platform);
}
```

## Database Integration

### Tables Used
```sql
-- Social media generation tracking
CREATE TABLE social_media_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  blog_post_id uuid REFERENCES blog_posts,
  platforms text[] NOT NULL,
  generated_content jsonb NOT NULL,
  custom_context text,
  created_at timestamptz DEFAULT now()
);

-- Performance analytics
CREATE TABLE social_media_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES social_media_generations,
  platform text NOT NULL,
  engagement_score numeric,
  character_count integer,
  hashtag_count integer,
  quality_metrics jsonb
);
```

### Agent Requirements Check
```typescript
async function ensureSocialMediaAgent() {
  const { data: agent } = await supabase
    .from('openai_agents')
    .select('*')
    .eq('name', AGENT_NAMES.SOCIAL_MEDIA_AGENT)
    .single();
    
  if (!agent) {
    // Auto-create Social Media Agent with proper configuration
    await createSocialMediaAgent();
  }
}
```

## Advanced Features

### Thread Generation (Twitter)
```typescript
const threadStrategy = {
  maxThreadLength: 10,
  optimalTweetLength: 240,
  threadStructure: {
    hook: "Attention-grabbing opening tweet",
    body: "2-8 supporting tweets with key points", 
    conclusion: "Summary tweet with strong CTA"
  },
  continuityMarkers: ["🧵 1/n", "👇 More below", "🔄 Thread continues"]
};
```

### Carousel Content (LinkedIn)
```typescript
const carouselStructure = {
  slideCount: "3-10 slides optimal",
  slideContent: {
    title: "Compelling headline per slide",
    body: "2-3 key points maximum", 
    visual: "Supporting graphic or stat",
    progression: "Logical flow between slides"
  },
  finalSlide: "Strong CTA and contact info"
};
```

### Story Templates (Instagram)
```typescript
const storyFrameworks = {
  behind_the_scenes: "Process or day-in-life content",
  educational: "Quick tips or facts with visuals",
  engagement: "Polls, questions, or interactive elements",
  promotional: "Product/service highlights with swipe-up"
};
```

## Platform Integration

### Authentication & Posting
```typescript
// Future enhancement - direct platform posting
const platformAPIs = {
  linkedin: "LinkedIn API v2 for business posts",
  instagram: "Instagram Basic Display API for personal/business", 
  twitter: "Twitter API v2 for tweets and threads"
};
```

### Content Scheduling
```typescript
interface SchedulingOptions {
  platform: string;
  post_time: string;          // ISO datetime
  time_zone: string;         // User timezone
  auto_post: boolean;        // Enable automatic posting
  approval_required: boolean; // Require manual approval
}
```

## Performance Optimization

### Batch Processing
- Generate content for multiple platforms simultaneously
- Parallel API calls for faster processing
- Intelligent caching of blog post analysis

### Content Recycling
```typescript
const contentRecycling = {
  variations: "Generate multiple versions per platform",
  scheduling: "Space out similar content over time",
  refreshing: "Update content with current trends",
  repurposing: "Adapt content for different audiences"
};
```

## Quality Metrics & Analytics

### Engagement Prediction
```typescript
const engagementFactors = {
  contentType: "Educational vs promotional balance",
  timing: "Platform-optimal posting times",
  hashtags: "Trending vs branded hashtag mix",
  visualSync: "Content-image alignment score",
  callToAction: "CTA clarity and positioning"
};
```

### Performance Tracking
- Character count optimization
- Hashtag effectiveness analysis  
- Platform-specific engagement rates
- Content variation performance

## Error Handling & Validation

### Content Validation
```typescript
const validationRules = {
  characterLimits: "Enforce platform character limits",
  hashtagLimits: "Respect hashtag count restrictions", 
  contentQuality: "Minimum content substance requirements",
  brandCompliance: "Brand voice and guideline adherence",
  platformRules: "Community guidelines compliance"
};
```

### Fallback Strategies
- Template-based content generation for edge cases
- Automatic content shortening for limit compliance
- Alternative hashtag suggestions for blocked terms
- Manual review flagging for quality issues

## Integration Examples

### Frontend Usage
```typescript
import { SocialMediaGenerator } from '@/components/social-media/SocialMediaGenerator';

// Component usage
<SocialMediaGenerator 
  blogPostId="uuid-here"
  defaultPlatforms={['linkedin', 'instagram', 'twitter_x']}
  onGenerate={(results) => handleSocialResults(results)}
/>
```

### API Integration
```typescript
const { data, error } = await supabase.functions.invoke('social-media-agent', {
  body: {
    blog_post_id: 'post-uuid',
    platforms: ['linkedin', 'instagram'],
    custom_context: 'Focus on actionable tips for healthcare professionals'
  }
});
```

## Future Enhancements

### Planned Features
- **Direct Platform Posting**: API integration for automatic publishing
- **Content Calendar**: Advanced scheduling and planning tools
- **A/B Testing**: Content variation testing and optimization
- **Engagement Analytics**: Real-time performance tracking
- **Brand Voice Learning**: AI-powered brand voice adaptation

### Technical Improvements
- **Multi-Model Support**: Integration with specialized social media models
- **Real-time Trends**: Dynamic hashtag and trend integration
- **Visual AI**: Automatic visual content generation
- **Performance ML**: Machine learning for engagement optimization

---

**Related Documentation:**
- [Blog Content Generator](./blog-content-generator.md)
- [Visual Prompt Generator](./visual-prompt-generator.md)
- [System Prompt Agent](./system-prompt-agent.md)
- [Agent Deployment Templates](./agent-deployment-templates.md)