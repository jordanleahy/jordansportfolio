
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
      return data as CompanyPortfolio[];
    },
  });
};

export const useCompanyPortfolio = (companySlug: string) => {
  return useQuery({
    queryKey: ["company-portfolio", companySlug],
    queryFn: async () => {
      console.log('🔍 DEBUG: Starting portfolio fetch for slug:', companySlug);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('🔍 DEBUG: Auth error:', authError);
        throw authError;
      }
      
      console.log('🔍 DEBUG: Current user:', user?.id);
      
      // First, let's see all portfolios for this user
      const { data: allPortfolios, error: allError } = await supabase
        .from("company_portfolios")
        .select("id, company_slug, company_name, user_id")
        .order("created_at", { ascending: false });
      
      console.log('🔍 DEBUG: All portfolios:', allPortfolios);
      console.log('🔍 DEBUG: Looking for slug:', companySlug);
      
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
        slug: data?.company_slug,
        auth_user_id: user?.id,
        matches_auth: data?.user_id === user?.id
      });
      
      return data as CompanyPortfolio & { 
        job_applications?: { 
          job_description: string; 
          job_description_link?: string; 
          resume_link?: string; 
          cover_letter_link?: string; 
          created_at: string; 
        }; 
      } | null;
    },
    enabled: !!companySlug,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyPortfolio;
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
      const { data, error } = await supabase
        .from("company_portfolios")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyPortfolio;
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

export const useGeneratePortfolioContent = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobDescription: string) => {
      const { data, error } = await supabase.functions.invoke("generate-portfolio-content", {
        body: { jobDescription },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate portfolio content. Please try again.",
        variant: "destructive",
      });
      console.error("Generate portfolio content error:", error);
    },
  });
};
