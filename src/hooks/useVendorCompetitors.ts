import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Hook to fetch existing vendor company names for competitor selection
export const useVendorCompanyNames = () => {
  return useQuery({
    queryKey: ["vendor-company-names"],
    queryFn: async (): Promise<{ id: string; company_name: string; slug: string }[]> => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, company_name, slug")
        .order("company_name");

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

// Helper function to generate a slug from company name
const generateSlug = (companyName: string): string => {
  return companyName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Hook to safely create a new vendor when adding a competitor
export const useCreateVendorCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyName: string) => {
      // Check if vendor already exists
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id, company_name")
        .eq("company_name", companyName)
        .maybeSingle();

      if (existingVendor) {
        return existingVendor;
      }

      // Create minimal vendor record
      const slug = generateSlug(companyName);
      
      // Ensure slug is unique
      const { data: existingSlug } = await supabase
        .from("vendors")
        .select("slug")
        .eq("slug", slug)
        .maybeSingle();

      const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

      const { data: newVendor, error } = await supabase
        .from("vendors")
        .insert({
          company_name: companyName,
          slug: finalSlug,
          headquarters: "Unknown",
          company_type: "Unknown",
          description: `${companyName} - Added as competitor. Details to be updated.`,
          core_services: [],
          specialties: [],
          customers: [],
          key_features: [],
          key_benefits: [],
          key_investors: [],
          competitive_advantages: [],
          competitors: [],
          notable_customers: [],
          status: "draft",
          user_id: (await supabase.auth.getUser()).data.user?.id || ""
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newVendor;
    },
    onSuccess: (newVendor) => {
      // Invalidate and refetch vendor lists
      queryClient.invalidateQueries({ queryKey: ["vendor-company-names"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      
      toast({
        title: "Competitor Added",
        description: `${newVendor.company_name} has been added as a new vendor and competitor.`,
      });
    },
    onError: (error) => {
      console.error("Error creating vendor competitor:", error);
      toast({
        title: "Error",
        description: "Failed to create new competitor. Please try again.",
        variant: "destructive",
      });
    },
  });
};