import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComparisonData } from "@/data/comparisonData";

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  company1_data: any;
  company2_data: any;
  features: any;
  summary_insights: any;
  use_cases: any;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useComparisons = () => {
  return useQuery({
    queryKey: ["comparisons"],
    queryFn: async (): Promise<Comparison[]> => {
      const { data, error } = await supabase
        .from("comparisons")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Comparison[];
    },
  });
};

export const useComparisonBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["comparison", slug],
    queryFn: async (): Promise<Comparison | null> => {
      // Check if user is admin
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      const isAdmin = userRoles?.role === 'admin';
      
      let query = supabase
        .from("comparisons")
        .select("*")
        .eq("slug", slug);
      
      // Only filter by published status if user is not admin
      if (!isAdmin) {
        query = query.eq("status", "published");
      }
      
      const { data, error } = await query.single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows found
        }
        throw error;
      }

      return data as Comparison;
    },
    enabled: !!slug,
  });
};

export const useAdminComparisons = () => {
  return useQuery({
    queryKey: ["admin-comparisons"],
    queryFn: async (): Promise<Comparison[]> => {
      const { data, error } = await supabase
        .from("comparisons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Comparison[];
    },
  });
};

export const useCreateComparison = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comparison: Omit<Comparison, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("comparisons")
        .insert([comparison])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons"] });
    },
  });
};

export const useUpdateComparison = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Comparison> & { id: string }) => {
      const { data, error } = await supabase
        .from("comparisons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons"] });
    },
  });
};

export const useDeleteComparison = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("comparisons")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons"] });
    },
  });
};