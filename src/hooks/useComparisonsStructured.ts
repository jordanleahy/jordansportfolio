import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// TypeScript interfaces for the normalized structure
export interface ComparisonCompany {
  id: string;
  comparison_id: string;
  company_position: number;
  vendor_id?: string;
  name: string;
  founded?: string;
  headquarters?: string;
  key_benefits?: string[];
  unique_strengths?: string[];
}

export interface ComparisonBasicInfo {
  id: string;
  comparison_id: string;
  category: string;
  company1_value: string;
  company2_value: string;
  sort_order: number;
}

export interface ComparisonFeature {
  id: string;
  comparison_id: string;
  feature_name: string;
  company1_value: string;
  company2_value: string;
  sort_order: number;
}

export interface ComparisonUseCase {
  id: string;
  comparison_id: string;
  use_case: string;
  best_fit: string;
  sort_order: number;
}

export interface ComparisonInsight {
  id: string;
  comparison_id: string;
  company_position: number;
  insight_text: string;
}

export interface StructuredComparison {
  id: string;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
  companies: ComparisonCompany[];
  basic_info: ComparisonBasicInfo[];
  features: ComparisonFeature[];
  use_cases: ComparisonUseCase[];
  insights: ComparisonInsight[];
}

// Hook to fetch a comparison with all its structured data
export const useStructuredComparison = (id: string) => {
  return useQuery({
    queryKey: ["structured-comparison", id],
    queryFn: async (): Promise<StructuredComparison | null> => {
      // Fetch main comparison
      const { data: comparison, error: comparisonError } = await supabase
        .from("comparisons")
        .select("*")
        .eq("id", id)
        .single();

      if (comparisonError) {
        if (comparisonError.code === "PGRST116") {
          return null;
        }
        throw comparisonError;
      }

      // Fetch all related data in parallel
      const [
        { data: companies },
        { data: basicInfo },
        { data: features },
        { data: useCases },
        { data: insights }
      ] = await Promise.all([
        supabase.from("comparison_companies").select("*").eq("comparison_id", id).order("company_position"),
        supabase.from("comparison_basic_info").select("*").eq("comparison_id", id).order("sort_order"),
        supabase.from("comparison_features").select("*").eq("comparison_id", id).order("sort_order"),
        supabase.from("comparison_use_cases").select("*").eq("comparison_id", id).order("sort_order"),
        supabase.from("comparison_insights").select("*").eq("comparison_id", id).order("company_position")
      ]);

      return {
        ...comparison,
        companies: companies || [],
        basic_info: basicInfo || [],
        features: features || [],
        use_cases: useCases || [],
        insights: insights || []
      } as StructuredComparison;
    },
    enabled: !!id,
  });
};

// Hook to fetch a comparison by slug with all its structured data
export const useStructuredComparisonBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["structured-comparison-slug", slug],
    queryFn: async (): Promise<StructuredComparison | null> => {
      console.log('🔍 Fetching comparison for slug:', slug);
      
      // First get the comparison ID from slug
      const { data: comparison, error: comparisonError } = await supabase
        .from("comparisons")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (comparisonError) {
        console.error('❌ Error fetching comparison:', comparisonError);
        if (comparisonError.code === "PGRST116") {
          console.log('📭 No comparison found for slug:', slug);
          return null;
        }
        throw comparisonError;
      }

      console.log('✅ Found comparison:', comparison.title, 'ID:', comparison.id);

      // Fetch all related data in parallel
      const [
        { data: companies },
        { data: basicInfo },
        { data: features },
        { data: useCases },
        { data: insights }
      ] = await Promise.all([
        supabase.from("comparison_companies").select("*").eq("comparison_id", comparison.id).order("company_position"),
        supabase.from("comparison_basic_info").select("*").eq("comparison_id", comparison.id).order("sort_order"),
        supabase.from("comparison_features").select("*").eq("comparison_id", comparison.id).order("sort_order"),
        supabase.from("comparison_use_cases").select("*").eq("comparison_id", comparison.id).order("sort_order"),
        supabase.from("comparison_insights").select("*").eq("comparison_id", comparison.id).order("company_position")
      ]);

      console.log('📊 Structured data counts:', {
        companies: companies?.length || 0,
        basicInfo: basicInfo?.length || 0,
        features: features?.length || 0,
        useCases: useCases?.length || 0,
        insights: insights?.length || 0
      });

      // Build structured comparison from related tables
      return {
        ...comparison,
        companies: companies || [],
        basic_info: basicInfo || [],
        features: features || [],
        use_cases: useCases || [],
        insights: insights || []
      } as StructuredComparison;
    },
    enabled: !!slug,
  });
};

// Hook to fetch published comparisons for public index page with metadata
export const useComparisons = () => {
  return useQuery({
    queryKey: ["comparisons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparisons")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!data) return [];

      // Fetch companies, features count, and use cases count for each comparison
      const enrichedData = await Promise.all(
        data.map(async (comparison) => {
          const [
            { data: companies },
            { data: features },
            { data: useCases }
          ] = await Promise.all([
            supabase
              .from("comparison_companies")
              .select("name, company_position")
              .eq("comparison_id", comparison.id)
              .order("company_position"),
            supabase
              .from("comparison_features")
              .select("id")
              .eq("comparison_id", comparison.id),
            supabase
              .from("comparison_use_cases")
              .select("id")
              .eq("comparison_id", comparison.id)
          ]);

          return {
            ...comparison,
            companies: companies || [],
            featureCount: features?.length || 0,
            useCaseCount: useCases?.length || 0
          };
        })
      );

      return enrichedData;
    },
  });
};

// Hook to fetch all comparisons for admin
export const useAdminComparisons = () => {
  return useQuery({
    queryKey: ["admin-comparisons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparisons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};

// Hook to delete a comparison
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
      queryClient.invalidateQueries({ queryKey: ["structured-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["structured-comparison-slug"] });
    },
  });
};

// Hook to create a structured comparison
export const useCreateStructuredComparison = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      meta_title: string;
      meta_description: string;
      slug: string;
      status: 'draft' | 'published';
      created_by: string;
      companies: Omit<ComparisonCompany, 'id' | 'comparison_id'>[];
      basic_info: Omit<ComparisonBasicInfo, 'id' | 'comparison_id'>[];
      features: Omit<ComparisonFeature, 'id' | 'comparison_id'>[];
      use_cases: Omit<ComparisonUseCase, 'id' | 'comparison_id'>[];
      insights: Omit<ComparisonInsight, 'id' | 'comparison_id'>[];
    }) => {
      // Create the main comparison record
      const { data: comparison, error: comparisonError } = await supabase
        .from("comparisons")
        .insert([{
          title: data.title,
          meta_title: data.meta_title,
          meta_description: data.meta_description,
          slug: data.slug,
          status: data.status,
          created_by: data.created_by
        }])
        .select()
        .single();

      if (comparisonError) {
        throw comparisonError;
      }

      const comparisonId = comparison.id;

      // Insert all related data in parallel
      const insertPromises = [];

      if (data.companies.length > 0) {
        insertPromises.push(
          supabase.from("comparison_companies").insert(
            data.companies.map(company => ({ ...company, comparison_id: comparisonId }))
          )
        );
      }

      if (data.basic_info.length > 0) {
        insertPromises.push(
          supabase.from("comparison_basic_info").insert(
            data.basic_info.map((info, index) => ({ ...info, comparison_id: comparisonId, sort_order: index }))
          )
        );
      }

      if (data.features.length > 0) {
        insertPromises.push(
          supabase.from("comparison_features").insert(
            data.features.map((feature, index) => ({ ...feature, comparison_id: comparisonId, sort_order: index }))
          )
        );
      }

      if (data.use_cases.length > 0) {
        insertPromises.push(
          supabase.from("comparison_use_cases").insert(
            data.use_cases.map((useCase, index) => ({ ...useCase, comparison_id: comparisonId, sort_order: index }))
          )
        );
      }

      if (data.insights.length > 0) {
        insertPromises.push(
          supabase.from("comparison_insights").insert(
            data.insights.map(insight => ({ ...insight, comparison_id: comparisonId }))
          )
        );
      }

      await Promise.all(insertPromises);

      return comparison;
    },
    onSuccess: () => {
      // Invalidate all comparison-related queries
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["structured-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["structured-comparison-slug"] });
      // Also invalidate the old comparison queries during transition
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
    },
  });
};

// Hook to update a structured comparison
export const useUpdateStructuredComparison = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      meta_title?: string;
      meta_description?: string;
      slug?: string;
      status?: 'draft' | 'published';
      companies?: Omit<ComparisonCompany, 'comparison_id'>[];
      basic_info?: Omit<ComparisonBasicInfo, 'comparison_id'>[];
      features?: Omit<ComparisonFeature, 'comparison_id'>[];
      use_cases?: Omit<ComparisonUseCase, 'comparison_id'>[];
      insights?: Omit<ComparisonInsight, 'comparison_id'>[];
    }) => {
      const { id, companies, basic_info, features, use_cases, insights, ...mainUpdate } = data;

      // Update main comparison if there are main fields to update
      if (Object.keys(mainUpdate).length > 0) {
        const { error: comparisonError } = await supabase
          .from("comparisons")
          .update(mainUpdate)
          .eq("id", id);

        if (comparisonError) {
          throw comparisonError;
        }
      }

      // Update related data if provided
      const updatePromises = [];

      if (companies) {
        // Delete existing companies and insert new ones
        updatePromises.push(
          supabase.from("comparison_companies").delete().eq("comparison_id", id).then(async () => {
            if (companies.length > 0) {
              await supabase.from("comparison_companies").insert(
                companies.map(company => ({ ...company, comparison_id: id }))
              );
            }
          })
        );
      }

      if (basic_info) {
        updatePromises.push(
          supabase.from("comparison_basic_info").delete().eq("comparison_id", id).then(async () => {
            if (basic_info.length > 0) {
              await supabase.from("comparison_basic_info").insert(
                basic_info.map((info, index) => ({ ...info, comparison_id: id, sort_order: index }))
              );
            }
          })
        );
      }

      if (features) {
        updatePromises.push(
          supabase.from("comparison_features").delete().eq("comparison_id", id).then(async () => {
            if (features.length > 0) {
              await supabase.from("comparison_features").insert(
                features.map((feature, index) => ({ ...feature, comparison_id: id, sort_order: index }))
              );
            }
          })
        );
      }

      if (use_cases) {
        updatePromises.push(
          supabase.from("comparison_use_cases").delete().eq("comparison_id", id).then(async () => {
            if (use_cases.length > 0) {
              await supabase.from("comparison_use_cases").insert(
                use_cases.map((useCase, index) => ({ ...useCase, comparison_id: id, sort_order: index }))
              );
            }
          })
        );
      }

      if (insights) {
        updatePromises.push(
          supabase.from("comparison_insights").delete().eq("comparison_id", id).then(async () => {
            if (insights.length > 0) {
              await supabase.from("comparison_insights").insert(
                insights.map(insight => ({ ...insight, comparison_id: id }))
              );
            }
          })
        );
      }

      await Promise.all(updatePromises);

      return { id };
    },
    onSuccess: (result) => {
      // Invalidate all comparison-related queries
      queryClient.invalidateQueries({ queryKey: ["comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["structured-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["structured-comparison-slug"] });
      // Also invalidate the old comparison queries during transition
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
      
      // Immediately refetch the admin comparisons to ensure real-time update
      queryClient.refetchQueries({ queryKey: ["admin-comparisons"] });
    },
  });
};
