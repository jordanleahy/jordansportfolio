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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
        body: {
          category,
          theme: `Rich system prompt for ${category}`,
          description: `Generate comprehensive system prompt for ${category} visual content`,
          user_id: user.id,
          sample_posts: [
            {
              title: `Sample ${category} content`,
              description: `Example content for ${category} category`
            }
          ]
        }
      });


      if (error) {
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      if (data?.system_prompt) {
        // Insert into the new system_prompts table
        
        const { error: insertError } = await supabase
          .from('system_prompts')
          .upsert({
            agent_id: crypto.randomUUID(),
            category,
            name: `${category} System Prompt`,
            prompt_text: data.system_prompt,
            agent_name: 'System Prompt Generator',
            agent_purpose: 'Generate system prompts for categories',
            agent_owner: 'System',
            description: `System prompt for ${category} category`,
            version: 1,
            user_id: user.id
          }, {
            onConflict: 'category'
          });

        if (insertError) {
          throw insertError;
        }
        toast({
          title: "System prompt generated!",
          description: `Rich system prompt for ${category} has been created`,
        });

        onSuccess?.();
      } else {
        throw new Error('No system prompt returned from edge function');
      }
    } catch (error: any) {
      console.error('Error generating system prompt:', error);
      
      // More specific error messages
      let errorMessage = error.message || "Please try again later";
      
      if (error.message?.includes('OpenAI API key')) {
        errorMessage = "OpenAI API key not configured. Please contact your administrator.";
      } else if (error.message?.includes('not found')) {
        errorMessage = "System Prompt Generator agent not found. Please create one first.";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Failed to generate system prompt",
        description: errorMessage,
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