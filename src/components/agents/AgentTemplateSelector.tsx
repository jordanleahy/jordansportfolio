import { Button } from '@/components/ui/button';
import { CreateAgentData } from '@/types/openaiAgent';

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: CreateAgentData) => void;
}

const BLOG_VISUAL_TEMPLATE: CreateAgentData = {
  name: 'Blog Visual Prompt Generator',
  purpose: 'Generates AI image prompts for blog visuals across different categories (Healthcare, Contracts, Design). Dynamically selects appropriate system prompts based on the category passed in the request.',
  model_version: 'gpt-4o-mini',
  trigger: 'api_call',
  input_source: 'Category and blog content (JSON)',
  output_target: 'Generated image prompt (JSON)',
  schedule: 'on-demand',
  owner: 'Content Marketing Team',
  status: 'active',
  tags: ['blog', 'content-generation', 'image-prompts', 'ai-writing', 'visual-content'],
  notes: 'Multi-category blog visual prompt generator with healthcare, contracts, and design system prompts.',
  system_prompts: [
    {
      category: 'healthcare',
      prompt: `You are an expert at creating detailed, professional image generation prompts for healthcare-themed AI image generators. 

Focus on creating clear, specific prompts that will generate high-quality, professional healthcare visuals that are:
- Medical and clinical in nature
- Professional and trustworthy
- Suitable for healthcare professionals
- Vector illustration style
- Clean, modern design
- Appropriate color palette (blues, greens, whites)
- Include relevant medical elements (stethoscopes, charts, technology)
- Avoid any graphic medical content
- Focus on positive, professional healthcare imagery

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional healthcare visuals.`
    },
    {
      category: 'contracts',
      prompt: `You are an expert at creating detailed, professional image generation prompts for business and contract-themed AI image generators.

Focus on creating clear, specific prompts that will generate high-quality, professional business visuals that are:
- Business and corporate in nature
- Professional and trustworthy
- Suitable for business professionals
- Vector illustration style
- Clean, modern design
- Appropriate color palette (blues, grays, whites, professional tones)
- Include relevant business elements (documents, handshakes, charts, technology)
- Focus on contract management, revenue cycle, and business processes
- Professional, clean imagery

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional business visuals.`
    },
    {
      category: 'design',
      prompt: `You are an expert at creating detailed, professional image generation prompts for design-themed AI image generators.

Focus on creating clear, specific prompts that will generate high-quality, professional design visuals that are:
- Creative and innovative in nature
- Professional and inspiring
- Suitable for design professionals
- Vector illustration style
- Clean, modern design
- Vibrant but professional color palette
- Include relevant design elements (tools, interfaces, creative processes)
- Focus on UI/UX, graphic design, and creative workflows
- Inspiring, creative imagery

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional design visuals.`
    }
  ],
  supported_categories: ['healthcare', 'contracts', 'design']
};

export const AgentTemplateSelector = ({ onSelectTemplate }: AgentTemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Quick start with a pre-configured template:
      </div>
      <Button 
        variant="outline" 
        onClick={() => onSelectTemplate(BLOG_VISUAL_TEMPLATE)}
        className="w-full justify-start text-left h-auto p-4"
      >
        <div>
          <div className="font-medium">Blog Visual Prompt Generator</div>
          <div className="text-sm text-muted-foreground mt-1">
            Multi-category agent for generating AI image prompts for blog visuals
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Includes: Healthcare, Contracts, and Design system prompts
          </div>
        </div>
      </Button>
    </div>
  );
};