import { v4 as uuidv4 } from 'uuid';
import type { Vendor } from '@/types/vendor';
import type { 
  ComparisonFormState, 
  ComparisonStructuredData,
  ComparisonFormData,
  FeatureRow,
  UseCaseRow,
  BasicInfoRow,
  SummaryInsights
} from '@/types/comparisonForm';

/**
 * Map vendor data to form state
 */
export const mapVendorsToFormData = (
  vendor1: Vendor | undefined,
  vendor2: Vendor | undefined,
  isEdit: boolean
): Partial<ComparisonFormData> => {
  if (!vendor1 || !vendor2 || isEdit) return {};

  const title = `${vendor1.company_name} vs ${vendor2.company_name}`;
  const slug = generateSlug(`${vendor1.company_name}vs${vendor2.company_name}`);

  return {
    title,
    slug,
    meta_title: `${title} - Detailed Comparison`,
    meta_description: `Compare ${vendor1.company_name} and ${vendor2.company_name}. Detailed analysis of features, pricing, and use cases.`
  };
};

/**
 * Map structured comparison from backend to form state
 */
export const mapStructuredComparisonToFormState = (
  structuredComparison: any
): Partial<ComparisonFormState> => {
  return {
    formData: {
      title: structuredComparison.title,
      meta_title: structuredComparison.meta_title,
      meta_description: structuredComparison.meta_description,
      slug: structuredComparison.slug,
      company1_id: structuredComparison.companies?.[0]?.vendor_id || '',
      company2_id: structuredComparison.companies?.[1]?.vendor_id || '',
      status: structuredComparison.status as 'draft' | 'published',
    },
    basicInfo: structuredComparison.basic_info?.map((info: any) => ({
      id: info.id || uuidv4(),
      category: info.category,
      company1: info.company1_value,
      company2: info.company2_value,
    })) || getDefaultBasicInfo(),
    features: structuredComparison.features?.map((feature: any) => ({
      id: feature.id || uuidv4(),
      feature: feature.feature_name,
      company1: feature.company1_value,
      company2: feature.company2_value,
    })) || getDefaultFeatures(),
    useCases: structuredComparison.use_cases?.map((useCase: any) => ({
      id: useCase.id || uuidv4(),
      useCase: useCase.use_case,
      bestFit: useCase.best_fit,
    })) || getDefaultUseCases(),
    summaryInsights: {
      company1: structuredComparison.insights?.find((i: any) => i.company_position === 1)?.insight_text || '',
      company2: structuredComparison.insights?.find((i: any) => i.company_position === 2)?.insight_text || '',
    }
  };
};

/**
 * Map AI generated data to form state
 */
export const mapGeneratedDataToFormState = (
  parsedData: any,
  generateSlugFn: (title: string) => string
): Partial<ComparisonFormState> => {
  const updates: Partial<ComparisonFormState> = {
    generatedData: parsedData
  };

  // Update form data with generated metadata
  if (parsedData.comparison) {
    updates.formData = {
      title: parsedData.comparison.title || '',
      meta_title: parsedData.comparison.meta_title || '',
      meta_description: parsedData.comparison.meta_description || '',
      slug: generateSlugFn(parsedData.comparison.title || ''),
    } as ComparisonFormData;
  }

  // Update structured data arrays
  if (parsedData.basic_info) {
    updates.basicInfo = parsedData.basic_info.map((info: any) => ({
      id: uuidv4(),
      category: info.category,
      company1: info.company1_value,
      company2: info.company2_value,
    }));
  }

  if (parsedData.features) {
    updates.features = parsedData.features.map((f: any) => ({
      id: uuidv4(),
      feature: f.feature_name,
      company1: f.company1_value,
      company2: f.company2_value
    }));
  }

  if (parsedData.insights) {
    const insight1 = parsedData.insights.find((i: any) => i.company_position === 1);
    const insight2 = parsedData.insights.find((i: any) => i.company_position === 2);
    updates.summaryInsights = {
      company1: insight1?.insight_text || '',
      company2: insight2?.insight_text || ''
    };
  }

  if (parsedData.use_cases) {
    updates.useCases = parsedData.use_cases.map((uc: any) => ({
      id: uuidv4(),
      useCase: uc.use_case,
      bestFit: uc.best_fit
    }));
  }

  return updates;
};

/**
 * Map form state to structured data for backend
 */
export const mapFormStateToStructuredData = (
  formState: ComparisonFormState,
  vendor1: Vendor,
  vendor2: Vendor,
  userId: string,
  status: 'draft' | 'published'
): ComparisonStructuredData => {
  return {
    title: formState.formData.title,
    meta_title: formState.formData.meta_title,
    meta_description: formState.formData.meta_description,
    slug: formState.formData.slug,
    status,
    created_by: userId,
    companies: [
      {
        id: uuidv4(),
        company_position: 1,
        vendor_id: vendor1.id || undefined,
        name: vendor1.company_name,
        founded: vendor1.founding_year?.toString() || 'N/A',
        headquarters: vendor1.headquarters,
        key_benefits: vendor1.key_benefits || [],
        unique_strengths: vendor1.competitive_advantages || [],
      },
      {
        id: uuidv4(),
        company_position: 2,
        vendor_id: vendor2.id || undefined,
        name: vendor2.company_name,
        founded: vendor2.founding_year?.toString() || 'N/A',
        headquarters: vendor2.headquarters,
        key_benefits: vendor2.key_benefits || [],
        unique_strengths: vendor2.competitive_advantages || [],
      }
    ],
    basic_info: formState.basicInfo
      .filter(b => b.category.trim())
      .map((info, index) => ({
        id: info.id,
        category: info.category,
        company1_value: info.company1,
        company2_value: info.company2,
        sort_order: index
      })),
    features: formState.features
      .filter(f => f.feature.trim())
      .map((feature, index) => ({
        id: feature.id,
        feature_name: feature.feature,
        company1_value: feature.company1.toString(),
        company2_value: feature.company2.toString(),
        sort_order: index
      })),
    use_cases: formState.useCases
      .filter(u => u.useCase.trim())
      .map((useCase, index) => ({
        id: useCase.id,
        use_case: useCase.useCase,
        best_fit: useCase.bestFit,
        sort_order: index
      })),
    insights: [
      ...(formState.summaryInsights.company1 ? [{
        id: uuidv4(),
        company_position: 1,
        insight_text: formState.summaryInsights.company1
      }] : []),
      ...(formState.summaryInsights.company2 ? [{
        id: uuidv4(),
        company_position: 2,
        insight_text: formState.summaryInsights.company2
      }] : [])
    ]
  };
};

/**
 * Generate slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

/**
 * Get default basic info rows
 */
export const getDefaultBasicInfo = (): BasicInfoRow[] => [
  { id: uuidv4(), category: 'Founded', company1: '', company2: '' },
  { id: uuidv4(), category: 'Headquarters', company1: '', company2: '' },
  { id: uuidv4(), category: 'Company Type', company1: '', company2: '' },
  { id: uuidv4(), category: 'Funding', company1: '', company2: '' },
  { id: uuidv4(), category: 'Investors', company1: '', company2: '' },
  { id: uuidv4(), category: 'Employee Size', company1: '', company2: '' },
  { id: uuidv4(), category: 'Delivery Model', company1: '', company2: '' },
  { id: uuidv4(), category: 'Target Customers', company1: '', company2: '' },
  { id: uuidv4(), category: 'Primary Solutions', company1: '', company2: '' },
  { id: uuidv4(), category: 'AI Core', company1: '', company2: '' },
  { id: uuidv4(), category: 'EHR Integration', company1: '', company2: '' }
];

/**
 * Get default feature rows
 */
export const getDefaultFeatures = (): FeatureRow[] => [
  { id: uuidv4(), feature: '', company1: '', company2: '' }
];

/**
 * Get default use case rows
 */
export const getDefaultUseCases = (): UseCaseRow[] => [
  { id: uuidv4(), useCase: '', bestFit: '' }
];