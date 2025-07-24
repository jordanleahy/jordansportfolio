import { supabase } from "@/integrations/supabase/client";

// Helper function to migrate a single comparison from JSONB to structured tables
export const migrateComparisonToStructured = async (comparisonId: string) => {
  // Fetch the comparison with JSONB data
  const { data: comparison, error } = await supabase
    .from("comparisons")
    .select("*")
    .eq("id", comparisonId)
    .single();

  if (error || !comparison) {
    throw new Error(`Failed to fetch comparison: ${error?.message}`);
  }

  const insertPromises = [];

  // Migrate company data
  if (comparison.company1_data && typeof comparison.company1_data === 'object') {
    const company1 = comparison.company1_data as any;
    insertPromises.push(
      supabase.from("comparison_companies").upsert({
        comparison_id: comparisonId,
        company_position: 1,
        vendor_id: company1.id,
        name: company1.name || 'Unknown',
        founded: company1.founded,
        headquarters: company1.headquarters,
        key_benefits: company1.keyBenefits || [],
        unique_strengths: company1.uniqueStrengths || []
      }, {
        onConflict: 'comparison_id,company_position'
      })
    );
  }

  if (comparison.company2_data && typeof comparison.company2_data === 'object') {
    const company2 = comparison.company2_data as any;
    insertPromises.push(
      supabase.from("comparison_companies").upsert({
        comparison_id: comparisonId,
        company_position: 2,
        vendor_id: company2.id,
        name: company2.name || 'Unknown',
        founded: company2.founded,
        headquarters: company2.headquarters,
        key_benefits: company2.keyBenefits || [],
        unique_strengths: company2.uniqueStrengths || []
      }, {
        onConflict: 'comparison_id,company_position'
      })
    );
  }

  // Migrate basic_info if it exists
  if (comparison.basic_info && Array.isArray(comparison.basic_info)) {
    const basicInfo = comparison.basic_info as any[];
    if (basicInfo.length > 0) {
      // Delete existing and insert new
      await supabase.from("comparison_basic_info").delete().eq("comparison_id", comparisonId);
      
      insertPromises.push(
        supabase.from("comparison_basic_info").insert(
          basicInfo.map((info, index) => ({
            comparison_id: comparisonId,
            category: info.category || '',
            company1_value: info.company1 || '',
            company2_value: info.company2 || '',
            sort_order: index
          }))
        )
      );
    }
  }

  // Migrate features
  if (comparison.features && Array.isArray(comparison.features)) {
    const features = comparison.features as any[];
    if (features.length > 0) {
      await supabase.from("comparison_features").delete().eq("comparison_id", comparisonId);
      
      insertPromises.push(
        supabase.from("comparison_features").insert(
          features.map((feature, index) => ({
            comparison_id: comparisonId,
            feature_name: feature.feature || '',
            company1_value: feature.company1?.toString() || '',
            company2_value: feature.company2?.toString() || '',
            sort_order: index
          }))
        )
      );
    }
  }

  // Migrate use cases
  if (comparison.use_cases && Array.isArray(comparison.use_cases)) {
    const useCases = comparison.use_cases as any[];
    if (useCases.length > 0) {
      await supabase.from("comparison_use_cases").delete().eq("comparison_id", comparisonId);
      
      insertPromises.push(
        supabase.from("comparison_use_cases").insert(
          useCases.map((useCase, index) => ({
            comparison_id: comparisonId,
            use_case: useCase.useCase || '',
            best_fit: useCase.bestFit || '',
            sort_order: index
          }))
        )
      );
    }
  }

  // Migrate summary insights
  if (comparison.summary_insights && typeof comparison.summary_insights === 'object') {
    const insights = comparison.summary_insights as any;
    await supabase.from("comparison_insights").delete().eq("comparison_id", comparisonId);
    
    if (insights.company1) {
      insertPromises.push(
        supabase.from("comparison_insights").insert({
          comparison_id: comparisonId,
          company_position: 1,
          insight_text: insights.company1
        })
      );
    }

    if (insights.company2) {
      insertPromises.push(
        supabase.from("comparison_insights").insert({
          comparison_id: comparisonId,
          company_position: 2,
          insight_text: insights.company2
        })
      );
    }
  }

  // Execute all migrations
  await Promise.all(insertPromises);

  console.log(`Successfully migrated comparison ${comparisonId} to structured format`);
};

// Function to migrate all existing comparisons
export const migrateAllComparisonsToStructured = async () => {
  const { data: comparisons, error } = await supabase
    .from("comparisons")
    .select("id");

  if (error) {
    throw new Error(`Failed to fetch comparisons: ${error.message}`);
  }

  for (const comparison of comparisons || []) {
    try {
      await migrateComparisonToStructured(comparison.id);
    } catch (error) {
      console.error(`Failed to migrate comparison ${comparison.id}:`, error);
    }
  }

  console.log("Migration completed for all comparisons");
};