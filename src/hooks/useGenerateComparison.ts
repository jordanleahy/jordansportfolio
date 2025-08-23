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
        model_version: 'gpt-5-mini',
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
      console.log('🚀 [Frontend] Starting comparison generation');
      console.log('📊 [Frontend] Company 1:', { 
        name: vendor1.company_name, 
        id: vendor1.id 
      });
      console.log('📊 [Frontend] Company 2:', { 
        name: vendor2.company_name, 
        id: vendor2.id 
      });

      // Ensure the agent exists in the system
      console.log('🤖 [Frontend] Ensuring agent exists...');
      await ensureComparisonAgentExists();
      console.log('✅ [Frontend] Agent check complete');

      console.log('📤 [Frontend] Calling edge function...');
      const { data, error } = await supabase.functions.invoke('generate-comparison-pages', {
        body: {
          vendor1,
          vendor2
        }
      });

      if (error) {
        console.error('❌ [Frontend] Edge function error:', error);
        throw new Error(error.message || 'Failed to generate comparison');
      }

      console.log('📥 [Frontend] Edge function response:', data);
      
      // Parse the generated text to check company names
      try {
        const parsedResponse = JSON.parse(data.generatedText);
        console.log('🔍 [Frontend] Parsed response structure:', {
          hasComparison: !!parsedResponse.comparison,
          hasCompanies: !!parsedResponse.companies,
          companiesCount: parsedResponse.companies?.length,
          company1Name: parsedResponse.companies?.[0]?.name,
          company2Name: parsedResponse.companies?.[1]?.name,
          comparisonTitle: parsedResponse.comparison?.title
        });
      } catch (parseError) {
        console.error('❌ [Frontend] Failed to parse response:', parseError);
        console.log('🔍 [Frontend] Raw response:', data.generatedText);
      }
      
      return data;
    },
  });
};