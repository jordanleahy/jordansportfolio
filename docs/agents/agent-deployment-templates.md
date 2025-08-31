# Agent Templates

## Overview

Pre-configured agent templates for common use cases, enabling rapid agent deployment with best-practice configurations and proven performance patterns.

## Available Templates

### System Prompt Generator Template
```typescript
const systemPromptTemplate: AgentTemplate = {
  name: "System Prompt Generator",
  category: "core_orchestrator",
  model_version: "gpt-4.1-2025-04-14",
  max_completion_tokens: 15000,
  supported_categories: ["all"],
  template_data: {
    purpose: "Central orchestrator for generating specialized system prompts",
    input_source: "category_context",
    output_target: "system_prompts_table",
    trigger: "api_call",
    schedule: "on_demand"
  }
};
```

### Content Generation Template
```typescript
const contentGeneratorTemplate: AgentTemplate = {
  name: "Content Generator",
  category: "content_creation",
  model_version: "gpt-5-2025-08-07",
  max_completion_tokens: 5000,
  supported_categories: ["blog", "social_media", "marketing"],
  template_data: {
    purpose: "Generate high-quality content for various platforms",
    input_source: "user_prompt_with_context",
    output_target: "content_database",
    trigger: "user_request"
  }
};
```

### Visual Prompt Template
```typescript
const visualPromptTemplate: AgentTemplate = {
  name: "Visual Prompt Generator",
  category: "visual_content",
  model_version: "gpt-5-2025-08-07", 
  max_completion_tokens: 2000,
  supported_categories: ["healthcare", "design", "business"],
  template_data: {
    purpose: "Create detailed image generation prompts",
    input_source: "content_description",
    output_target: "image_generation_service"
  }
};
```

## Quick Deployment

### Using Templates
```typescript
import { useCreateAgentFromTemplate } from '@/hooks/useAgentTemplates';

const { mutate: createFromTemplate } = useCreateAgentFromTemplate();

// Deploy agent from template
await createFromTemplate({
  templateId: "system-prompt-generator",
  customizations: {
    name: "Healthcare System Prompt Generator",
    supported_categories: ["healthcare", "medical"]
  }
});
```

### Template Customization
```typescript
interface TemplateCustomization {
  name?: string;
  purpose?: string;
  model_version?: string;
  supported_categories?: string[];
  custom_parameters?: Record<string, any>;
}
```

---

**Related Documentation:**
- [Agent Documentation Template](./agent-documentation-template.md)
- [System Prompt Agent](./system-prompt-agent.md)
- [Performance Guidelines](./performance-monitoring.md)