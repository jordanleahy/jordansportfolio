import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanyPortfolio, CompanyPortfolioInput } from "@/types/companyPortfolio";
import { useToast } from "@/hooks/use-toast";

export const useCompanyPortfolios = () => {
  return useQuery({
    queryKey: ["company-portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_portfolios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        generated_content: item.generated_content as any
      })) as CompanyPortfolio[];
    },
  });
};

export const useCompanyPortfolio = (companySlug: string) => {
  return useQuery({
    queryKey: ["company-portfolio", companySlug],
    queryFn: async () => {
      console.log('🔍 DEBUG: Starting portfolio fetch for slug:', companySlug);
      
      const { data, error } = await supabase
        .from("company_portfolios")
        .select("*, job_applications(*)")
        .eq("company_slug", companySlug)
        .maybeSingle();

      if (error) {
        console.error('🔍 Portfolio fetch error:', error);
        throw error;
      }
      
      console.log('🔍 Portfolio fetch result:', {
        found: !!data,
        id: data?.id,
        company_name: data?.company_name,
        user_id: data?.user_id,
        slug: data?.company_slug
      });
      
      if (!data) return null;
      
      return {
        ...data,
        generated_content: data.generated_content as any
      } as CompanyPortfolio & { 
        job_applications?: { 
          job_description: string; 
          job_description_link?: string; 
          resume_link?: string; 
          cover_letter_link?: string; 
          created_at: string; 
        }; 
      };
    },
    enabled: !!companySlug,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(2000 * 1.5 ** attemptIndex, 15000),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data
  });
};

export const useCreateCompanyPortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CompanyPortfolioInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("company_portfolios")
        .insert({ 
          ...input, 
          user_id: user.id, 
          generated_content: input.generated_content ? input.generated_content as any : null
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        generated_content: data.generated_content as any
      } as CompanyPortfolio;
    },
    onSuccess: (data) => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["company-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["company-portfolio", data.company_slug] });
      queryClient.invalidateQueries({ queryKey: ["company-portfolio"] }); // Invalidate all portfolio queries
      
      toast({
        title: "Portfolio created",
        description: "Company portfolio has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company portfolio. Please try again.",
        variant: "destructive",
      });
      console.error("Create company portfolio error:", error);
    },
  });
};

export const useUpdateCompanyPortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CompanyPortfolioInput>) => {
      const updateData: any = { ...input };
      if (updateData.generated_content) {
        updateData.generated_content = updateData.generated_content as any;
      }
      
      const { data, error } = await supabase
        .from("company_portfolios")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        generated_content: data.generated_content as any
      } as CompanyPortfolio;
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["company-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["company-portfolio", data.company_slug] });
      queryClient.invalidateQueries({ queryKey: ["company-portfolio"] });
      
      toast({
        title: "Portfolio updated",
        description: "Company portfolio has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company portfolio. Please try again.",
        variant: "destructive",
      });
      console.error("Update company portfolio error:", error);
    },
  });
};

export const useGenerateCoverLetterWithAgent = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      jobDescription, 
      companyName, 
      roleType = 'product_manager' 
    }: { 
      jobDescription: string; 
      companyName: string; 
      roleType?: 'product_manager' | 'product_designer';
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User authentication required');
      }

      const { data, error } = await supabase.functions.invoke("cover-letter-agent", {
        body: { 
          jobDescription, 
          companyName, 
          roleType, 
          userId: user.id 
        },
      });

      if (error || !data?.success) throw new Error(error?.message || 'Failed to generate cover letter');
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    },
  });
};