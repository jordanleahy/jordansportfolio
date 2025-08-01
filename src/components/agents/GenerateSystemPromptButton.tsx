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
    console.log('Starting system prompt generation for category:', category);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      console.log('User ID:', user.id);
      
      // Call the edge function directly
      console.log('Calling invoke-system-prompt-agent edge function...');
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

      console.log('Edge function response:', { data, error });
      console.log('Edge function response status:', { data, error });

      if (error) {
        console.error('Edge function error details:', JSON.stringify(error, null, 2));
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      if (data?.system_prompt) {
        console.log('Generated system prompt:', data.system_prompt);
        
        // Update the agent with the new system prompt
        console.log('Updating agent with new system prompt...');
        
        // Get current agent data first to preserve existing prompts for other categories
        const { data: currentAgent, error: fetchError } = await supabase
          .from('openai_agents')
          .select('system_prompts, supported_categories')
          .eq('id', agentId)
          .single();

        if (fetchError) {
          console.error('Error fetching current agent:', fetchError);
          throw fetchError;
        }

        // Update or add the new prompt for this category
        const existingPrompts = Array.isArray(currentAgent.system_prompts) 
          ? currentAgent.system_prompts as any[]
          : [];
        const updatedPrompts = existingPrompts.filter((p: any) => p.category !== category);
        updatedPrompts.push({
          category,
          prompt: data.system_prompt
        });

        // Update supported categories if needed
        const currentCategories = Array.isArray(currentAgent.supported_categories)
          ? currentAgent.supported_categories as string[]
          : [];
        const updatedCategories = currentCategories.includes(category) 
          ? currentCategories 
          : [...currentCategories, category];

        const { error: updateError } = await supabase
          .from('openai_agents')
          .update({
            system_prompts: updatedPrompts,
            supported_categories: updatedCategories,
            last_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        console.log('Agent updated successfully');
        toast({
          title: "System prompt generated!",
          description: `Rich system prompt for ${category} has been created`,
        });

        onSuccess?.();
      } else {
        console.error('No system prompt in response:', data);
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