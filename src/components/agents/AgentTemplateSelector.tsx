import { Button } from '@/components/ui/button';
import { CreateAgentData } from '@/types/openaiAgent';
import { useAgentTemplates } from '@/hooks/useAgentTemplates';
import { Loader2 } from 'lucide-react';

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: CreateAgentData) => void;
}

export const AgentTemplateSelector = ({ onSelectTemplate }: AgentTemplateSelectorProps) => {
  const { data: templates, isLoading, error } = useAgentTemplates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load templates. Please try again.
      </div>
    );
  }

  if (!templates?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No templates available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Quick start with a pre-configured template:
      </div>
      {templates.map((template) => (
        <Button 
          key={template.id}
          variant="outline" 
          onClick={() => onSelectTemplate(template.template_data)}
          className="w-full justify-start text-left h-auto p-4"
        >
          <div>
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {template.description || template.template_data.purpose}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Category: {template.category} • {template.is_system ? 'System Template' : 'User Template'}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};