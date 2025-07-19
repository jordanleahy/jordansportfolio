
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Vendor } from "@/types/vendor";

export const useVendors = () => {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("company_name");

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

export const useVendorBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["vendor", slug],
    queryFn: async (): Promise<Vendor | null> => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows found
        }
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });
};
