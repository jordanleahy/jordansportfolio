import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateAgent } from "@/hooks/useOpenAIAgents";
import type { Vendor } from "@/types/vendor";

interface GenerateComparisonRequest {
  vendor1: Vendor;
  vendor2: Vendor;
}

interface GenerateComparisonResponse {
  generatedText: string;
}

export const useGenerateComparison = () => {
  const queryClient = useQueryClient();
  const createAgent = useCreateAgent();

  const ensureComparisonAgentExists = async () => {
    // Check if GenerateComparisonPages agent already exists
    const { data: existingAgents } = await supabase
      .from('openai_agents')
      .select('id')
      .eq('name', 'GenerateComparisonPages')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (!existingAgents || existingAgents.length === 0) {
      // Create the agent entry
      await createAgent.mutateAsync({
        name: 'GenerateComparisonPages',
        purpose: 'Generates healthcare company comparisons using vendor data in the style of SmarterDX vs Iodine',
        model_version: 'gpt-4o',
        trigger: 'manual',
        input_source: 'Vendor database records',
        output_target: 'Comparison form fields',
        schedule: 'on-demand',
        owner: 'System',
        status: 'active',
        tags: ['comparison', 'healthcare', 'automation', 'content-generation'],
        notes: 'Automatically created agent for generating comparison pages. Uses specialized prompt to match SmarterDX vs Iodine comparison style.'
      });
    }
  };

  return useMutation({
    mutationFn: async ({ vendor1, vendor2 }: GenerateComparisonRequest): Promise<GenerateComparisonResponse> => {
      // Ensure the agent exists in the system
      await ensureComparisonAgentExists();

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: 'Generate a detailed comparison between these two healthcare companies',
          type: 'comparison',
          vendor1,
          vendor2
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate comparison');
      }

      return data;
    },
  });
};