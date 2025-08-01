import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GenerateSystemPromptButtonProps {
  agentId: string;
  category: string;
  onSuccess?: () => void;
}

export const GenerateSystemPromptButton = ({ 
  agentId, 
  category, 
  onSuccess 
}: GenerateSystemPromptButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!category) {
      toast({
        title: "No category selected",
        description: "Please select a category first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: {
          category,
          theme: `Rich system prompt for ${category}`,
          description: `Generate comprehensive system prompt for ${category} visual content`,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          sample_posts: [
            {
              title: `Sample ${category} content`,
              description: `Example content for ${category} category`
            }
          ]
        }
      });

      if (error) {
        throw error;
      }

      if (data?.system_prompt) {
        // Update the agent with the new system prompt
        const { error: updateError } = await supabase
          .from('openai_agents')
          .update({
            system_prompts: [
              {
                category,
                prompt: data.system_prompt
              }
            ],
            last_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "System prompt generated!",
          description: `Rich system prompt for ${category} has been created`,
        });

        onSuccess?.();
      } else {
        throw new Error('No system prompt returned');
      }
    } catch (error: any) {
      console.error('Error generating system prompt:', error);
      toast({
        title: "Failed to generate system prompt",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !category}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4" />
      )}
      {isGenerating ? 'Generating...' : 'Generate Rich Prompt'}
    </Button>
  );
};