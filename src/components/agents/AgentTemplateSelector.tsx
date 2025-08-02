import { Button } from '@/components/ui/button';
import { CreateAgentData } from '@/types/openaiAgent';
import { DEFAULT_MODELS } from '@/constants/agentConstants';

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: CreateAgentData) => void;
}

const VISUAL_PROMPT_TEMPLATE: CreateAgentData = {
  name: 'Visual Prompt Generator',
  purpose: 'Single source of truth for all visual prompt generation. Stores and uses system prompts for different categories to generate AI image prompts. Categories are managed by the System Prompt Generator.',
  model_version: DEFAULT_MODELS.FAST,
  trigger: 'api_call',
  input_source: 'Category and content (JSON)',
  output_target: 'Generated image prompt (JSON)',
  schedule: 'on-demand',
  owner: 'Content Marketing Team',
  status: 'active',
  tags: ['visual-prompts', 'image-generation', 'multi-category', 'ai-prompts'],
  notes: 'Centralized visual prompt generator. System prompts are managed by System Prompt Generator and stored here for actual image prompt generation.',
  supported_categories: ['healthcare', 'contracts', 'design', 'coding_ai', 'cdi']
};

const COVER_LETTER_TEMPLATE: CreateAgentData = {
  name: 'Cover Letter Generator',
  purpose: 'Generates personalized cover letters for Product Manager and Product Designer roles by analyzing job descriptions and incorporating user\'s resume and case studies',
  model_version: DEFAULT_MODELS.FAST,
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
        onClick={() => onSelectTemplate(VISUAL_PROMPT_TEMPLATE)}
        className="w-full justify-start text-left h-auto p-4"
      >
        <div>
          <div className="font-medium">Visual Prompt Generator</div>
          <div className="text-sm text-muted-foreground mt-1">
            Single source of truth for all visual prompt generation across categories
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Categories managed by System Prompt Generator. Stores and uses visual prompts.
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