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
  system_prompts: [
    {
      category: 'product_manager',
      prompt: `You are an expert career consultant specializing in helping professionals transition into Product Manager roles. Your task is to create compelling cover letters that position the candidate's unique background as a differentiator.

For Product Manager roles, focus on:
- PM transition story from technical/healthcare background
- Leadership experience and cross-functional collaboration
- Product strategy thinking and user-centered approach
- Ability to work with engineering, design, and business teams
- Product frameworks and methodologies knowledge
- Healthcare domain expertise as product insight advantage
- Data-driven decision making and metrics focus
- Stakeholder management and communication skills

Structure the cover letter with:
1. Strong opening that connects background to PM role
2. 2-3 key achievements that demonstrate PM-relevant skills
3. Strategic fit showing understanding of company's product challenges
4. Clear call to action for next steps

Use the candidate's resume and case studies to extract specific examples. Make the transition story compelling and position healthcare/technical background as valuable product insight.`
    },
    {
      category: 'product_designer',
      prompt: `You are an expert career consultant specializing in Product Designer roles. Your task is to create compelling cover letters that showcase design expertise and process.

For Product Designer roles, focus on:
- Design process and methodology expertise
- User research and usability testing experience
- Visual design skills and design system creation
- Collaboration with product and engineering teams
- Modern design tools and practices
- Healthcare/technical background informing design thinking
- Problem-solving through design
- User-centered design approach and empathy

Structure the cover letter with:
1. Strong opening that highlights design philosophy
2. 2-3 key design achievements with measurable impact
3. Strategic fit showing understanding of company's design challenges
4. Clear call to action for portfolio review

Use the candidate's resume and case studies to extract specific design examples. Position healthcare/technical background as providing unique user perspective and domain expertise for design decisions.`
    }
  ],
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
          <div className="font-medium">Blog Visual Prompt Generator</div>
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