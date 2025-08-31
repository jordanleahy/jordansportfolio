# Visual Prompt Generator Agent

**Created:** 2024-11-01  
**Last Updated:** 2024-12-31

## Overview

**Purpose**: Specialized agent for creating detailed, professional image generation prompts with industry-specific context and brand consistency.

**Role**: Transforms content descriptions into sophisticated visual prompts for AI image generators, ensuring professional quality and brand alignment.

## Technical Specifications

### Model Configuration
```typescript
{
  model: "gpt-5-2025-08-07", // Latest flagship model
  max_completion_tokens: 2000, // Optimized for visual prompts
  // temperature: Fixed at 1.0 for GPT-5
  deployment: "supabase-edge-function"
}
```

### Input Schema
```typescript
interface VisualPromptRequest {
  content: string;           // Content description
  category: string;         // Industry category
  aspect_ratio: string;     // Image dimensions (16:9, 9:16, 1:1, 4:3)
  style_preferences?: {
    art_style: string;      // vector, realistic, illustration
    color_palette: string[]; // Brand colors
    complexity: string;     // simple, detailed, comprehensive
  };
  brand_context?: {
    industry: string;
    target_audience: string;
    visual_metaphors: string[];
  };
}
```

### Output Schema
```typescript
interface VisualPromptResponse {
  success: boolean;
  generated_prompt: string;
  style_elements: {
    foreground: string[];
    midground: string[];
    background: string[];
  };
  color_guidance: string;
  technical_specs: string;
  aspect_ratio_integration: string;
}
```

## Core Functionality

### Prompt Generation Framework

#### Visual Analysis Layers
```typescript
const analysisFramework = {
  industryContext: "How does this relate to {category} professionals?",
  professionalAudience: "What visuals resonate with {category} decision-makers?", 
  educationalValue: "How can the visual enhance understanding?",
  actionableInsights: "What scenarios should be depicted?"
};
```

#### Composition Structure
- **Foreground Elements**: Central focus on category-specific tools and concepts
- **Mid-ground Context**: Supporting environments and collaborative elements  
- **Background Foundation**: Professional settings with subtle branding elements

### Style & Rendering Framework

#### Art Styles
- **Vector Illustration**: Clean, modern business aesthetic
- **Professional Photography**: Realistic business environments
- **Digital Art**: Stylized professional illustrations
- **Infographic Style**: Data visualization and process flows

#### Color System Integration
```typescript
const colorPalette = {
  primary: ["#2563eb", "#1e40af"],      // Professional blues
  secondary: ["#0891b2", "#0e7490"],    // Trustworthy teals  
  accent: ["#16a34a", "#ea580c"],       // Success green, highlight orange
  neutral: ["#64748b", "#f8fafc"]       // Clean grays and whites
};
```

## Category-Specific Specializations

### Healthcare
- **Visual Metaphors**: Medical technology, patient care, clinical environments
- **Professional Elements**: Healthcare facilities, medical devices, care teams
- **Compliance**: HIPAA-appropriate imagery, patient privacy protection

### Contracts & Legal
- **Visual Elements**: Legal documents, professional meetings, compliance frameworks
- **Business Context**: Corporate environments, handshakes, document signing
- **Trust Indicators**: Professional authority and credibility

### Design & Creative
- **Visual Focus**: Design tools, creative processes, visual workflows
- **Innovation Elements**: Modern technology, creative collaboration
- **Aesthetic Balance**: Clean design principles with creative flair

### AI & Technology
- **Tech Elements**: AI interfaces, data visualization, digital transformation
- **Professional Context**: Modern offices, collaborative workspaces
- **Innovation Focus**: Cutting-edge technology with human interaction

## Advanced Features

### Aspect Ratio Optimization
```typescript
const aspectRatioGuidance = {
  "16:9": "arranged in a wide landscape composition showcasing workflow",
  "9:16": "designed in a vertical portrait orientation for mobile viewing", 
  "1:1": "composed in a balanced square format for social media",
  "4:3": "structured in a classic rectangular layout for presentations"
};
```

### Dynamic Prompt Adaptation
- **Content-Aware**: Analyzes input to determine optimal visual approach
- **Context-Sensitive**: Adapts language and elements based on industry
- **Brand-Consistent**: Integrates color themes and visual guidelines
- **Quality-Focused**: Ensures professional, credible visual outcomes

## Database Integration

### System Prompts Storage
```sql
-- Visual prompts by category
SELECT system_prompts 
FROM openai_agents 
WHERE name = 'Visual Prompt Generator'
AND JSON_EXTRACT(system_prompts, '$[*].category') LIKE '%healthcare%';

-- Performance tracking
INSERT INTO agent_performance_logs (
  agent_id, category, response_time_ms, quality_score
) VALUES ($1, $2, $3, $4);
```

### Categories Supported
- Healthcare & Medical
- Contracts & Legal  
- Design & UX
- Product Management
- AI & Technology
- Business & Finance
- Education & Training

## Edge Function Integration

### Endpoint
`supabase/functions/visual-prompt-generator/index.ts`

### Processing Pipeline
```typescript
async function generateVisualPrompt(request: VisualPromptRequest) {
  // 1. Analyze content and category
  const context = await analyzeContentContext(request);
  
  // 2. Build prompt with framework
  const promptStructure = await buildPromptFramework(context);
  
  // 3. Generate with GPT-5
  const response = await openai.chat.completions.create({
    model: "gpt-5-2025-08-07",
    messages: [
      { role: "system", content: getSystemPromptForCategory(request.category) },
      { role: "user", content: buildUserPrompt(request) }
    ],
    max_completion_tokens: 2000
  });
  
  // 4. Process and validate output
  return processGeneratedPrompt(response.choices[0].message.content);
}
```

## Quality Assurance

### Validation Criteria
1. **Professional Standards**: Industry-appropriate imagery and tone
2. **Brand Consistency**: Proper color usage and visual alignment
3. **Technical Quality**: Clear composition and rendering instructions
4. **Accessibility**: High contrast and readable visual elements
5. **Aspect Ratio Integration**: Natural incorporation of dimensions

### Quality Metrics
- **Visual Coherence**: 95% prompt clarity score
- **Brand Alignment**: Color theme compliance rate  
- **Professional Appropriateness**: Industry standard adherence
- **Generation Success**: Image generation success rate

## Performance Optimization

### Caching Strategy
```typescript
const cacheConfig = {
  promptTemplates: "24h TTL",
  categoryMappings: "1h TTL", 
  colorThemes: "6h TTL",
  userPreferences: "30m TTL"
};
```

### Batch Processing
- Multi-prompt generation for content calendars
- Parallel processing for different aspect ratios
- Bulk regeneration for theme updates

## Integration Patterns

### Frontend Usage
```typescript
import { generateVisualPrompt } from '@/utils/visualPromptGenerator';

const promptData = await generateVisualPrompt({
  content: "Healthcare AI automation workflow",
  category: "healthcare",
  aspect_ratio: "16:9",
  style_preferences: {
    art_style: "vector",
    complexity: "detailed"
  }
});
```

### Real-time Updates
```typescript
// WebSocket integration for live prompt updates
const { data: visualPrompts } = useRealtimePrompts();
```

## Error Handling & Recovery

### Common Issues
1. **Aspect Ratio Conflicts**: Automatic format adjustment
2. **Brand Color Mismatches**: Fallback to default palette
3. **Category Misalignment**: Intelligent category detection
4. **Quality Issues**: Automatic regeneration with refined parameters

### Fallback Strategies
- Template-based prompt generation
- Default visual framework application
- Simplified prompt structure for edge cases

## Monitoring & Analytics

### Performance Metrics
- **Generation Speed**: Target <5 seconds per prompt
- **Quality Score**: Visual coherence and professional standards
- **User Satisfaction**: Feedback and usage patterns
- **Success Rate**: Image generation compatibility

### Usage Analytics
- Popular categories and styles
- Aspect ratio preferences by industry
- Color theme effectiveness
- Performance trends over time

## Future Enhancements

### Planned Features
- **Style Learning**: AI-powered style preference learning
- **Brand Templates**: Custom brand prompt templates
- **A/B Testing**: Prompt variation testing framework
- **Multi-Model Support**: Integration with additional AI models

### Technical Improvements
- **Enhanced Caching**: Smarter cache invalidation
- **Parallel Processing**: Multi-threaded prompt generation
- **Quality AI**: Automated quality assessment
- **Performance Optimization**: Sub-second response times

---

**Related Documentation:**
- [System Prompt Agent](./system-prompt-agent.md)
- [Blog Content Generator](./blog-content-generator.md)
- [Agent Deployment Templates](./agent-deployment-templates.md)
- [Performance Monitoring](./performance-monitoring.md)