import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Vendor } from "@/types/vendor";

interface GenerateComparisonRequest {
  vendor1: Vendor;
  vendor2: Vendor;
}

interface GenerateComparisonResponse {
  generatedText: string;
}

export const useGenerateComparison = () => {
  return useMutation({
    mutationFn: async ({ vendor1, vendor2 }: GenerateComparisonRequest): Promise<GenerateComparisonResponse> => {
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