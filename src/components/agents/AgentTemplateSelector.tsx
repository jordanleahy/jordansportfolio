import { Button } from '@/components/ui/button';
import { CreateAgentData } from '@/types/openaiAgent';

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: CreateAgentData) => void;
}

const BLOG_VISUAL_TEMPLATE: CreateAgentData = {
  name: 'Visual Prompt Generator',
  purpose: 'Generates AI image prompts for blog visuals across different categories (Healthcare, Contracts, Design). Dynamically selects appropriate system prompts based on the category passed in the request.',
  model_version: 'gpt-4o-mini',
  trigger: 'api_call',
  input_source: 'Category and blog content (JSON)',
  output_target: 'Generated image prompt (JSON)',
  schedule: 'on-demand',
  owner: 'Content Marketing Team',
  status: 'active',
  tags: ['blog', 'content-generation', 'image-prompts', 'ai-writing', 'visual-content'],
  notes: 'Multi-category Visual Prompt Generator with healthcare, contracts, and design system prompts.',
  supported_categories: ['healthcare', 'contracts', 'design']
};

const COVER_LETTER_TEMPLATE: CreateAgentData = {
  name: 'Cover Letter Generator',
  purpose: 'Generates personalized cover letters for Product Manager and Product Designer roles by analyzing job descriptions and incorporating user\'s resume and case studies',
  model_version: 'gpt-4o-mini',
  trigger: 'api_call',
  input_source: 'Job description, company info, user resume, case studies (JSON)',
  output_target: 'Structured cover letter (JSON)',
  schedule: 'on-demand',
  owner: 'Career Development Team',
  status: 'active',
  tags: ['cover-letter', 'job-application', 'product-manager', 'product-designer', 'career'],
  notes: 'Specialized agent for generating tailored cover letters that leverage healthcare/technical background for PM and design roles.',
  supported_categories: ['product_manager', 'product_designer']
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
          <div className="font-medium">Visual Prompt Generator</div>
          <div className="text-sm text-muted-foreground mt-1">
            Multi-category agent for generating AI image prompts for blog visuals
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Includes: Healthcare, Contracts, and Design system prompts
          </div>
        </div>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => onSelectTemplate(COVER_LETTER_TEMPLATE)}
        className="w-full justify-start text-left h-auto p-4"
      >
        <div>
          <div className="font-medium">Cover Letter Generator</div>
          <div className="text-sm text-muted-foreground mt-1">
            Specialized agent for Product Manager and Product Designer cover letters
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Includes: Product Manager and Product Designer system prompts
          </div>
        </div>
      </Button>
    </div>
  );
};