import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface PromptPresetSelectorProps {
  onLoadPreset: (category: string, prompt: string) => void;
}

const PRESET_PROMPTS = {
  healthcare: `You are an expert at creating detailed, professional image generation prompts for healthcare-themed AI image generators. 

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

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional healthcare visuals.`,

  contracts: `You are an expert at creating detailed, professional image generation prompts for business and contract-themed AI image generators.

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

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional business visuals.`,

  design: `You are an expert at creating detailed, professional image generation prompts for design-themed AI image generators.

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
};

export const PromptPresetSelector = ({ onLoadPreset }: PromptPresetSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Load Preset
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>System Prompt Presets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onLoadPreset('healthcare', PRESET_PROMPTS.healthcare)}>
          Healthcare Prompts
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLoadPreset('contracts', PRESET_PROMPTS.contracts)}>
          Contracts & Business
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLoadPreset('design', PRESET_PROMPTS.design)}>
          Design & Creative
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};