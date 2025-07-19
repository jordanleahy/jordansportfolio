import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InvestmentResearchData {
  company_overview: {
    legal_entity: string;
    headquarters: string;
    executive_signer: string;
    corporate_structure: string;
    business_description: string;
    notable_feature: string;
  };
  financial_profile: {
    sec_form_filed: string;
    security_offered: string;
    total_offering: string;
    amount_sold: string;
    remaining: string;
    minimum_investment?: string;
    prior_funding: string[];
    revenue_metrics: string;
    burn_rate: string;
  };
  market_position: {
    target_market: string;
    competitive_landscape: string[];
    technology: string[];
  };
  risk_assessment: {
    regulatory: string[];
    leadership_check: string;
    litigation: string;
    concerns: string[];
  };
  next_steps: string[];
}

export interface InvestmentResearch {
  id: string;
  accessionnumber: string;
  research_data: InvestmentResearchData;
  generated_at: string;
  updated_at: string;
  created_by: string;
}

export const useInvestmentResearch = (accessionnumber: string | undefined) => {
  return useQuery({
    queryKey: ["investment-research", accessionnumber],
    queryFn: async () => {
      if (!accessionnumber) return null;
      
      // Return null for now - will be implemented once types are updated
      return null;
    },
    enabled: !!accessionnumber,
  });
};

export const useSaveInvestmentResearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      accessionnumber, 
      researchData 
    }: { 
      accessionnumber: string; 
      researchData: InvestmentResearchData;
    }) => {
      // For now, just simulate success
      console.log("Saving research data:", { accessionnumber, researchData });
      return { accessionnumber, research_data: researchData, generated_at: new Date().toISOString() };
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ 
          queryKey: ["investment-research", data.accessionnumber] 
        });
      }
      toast.success("Investment research generated successfully");
    },
    onError: (error) => {
      console.error("Error saving investment research:", error);
      toast.error("Failed to generate investment research");
    },
  });
};