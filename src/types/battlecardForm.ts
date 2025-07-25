export interface BattlecardFormData {
  title: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  company1_id: string;
  company2_id: string;
  status: 'draft' | 'published';
  og_image_url?: string;
}

export interface FeatureRow {
  id: string;
  feature: string;
  company1: boolean | string;
  company2: boolean | string;
}

export interface UseCaseRow {
  id: string;
  useCase: string;
  bestFit: string;
}

export interface BasicInfoRow {
  id: string;
  category: string;
  company1: string;
  company2: string;
}

export interface SummaryInsights {
  company1: string;
  company2: string;
}

export interface BattlecardFormState {
  formData: BattlecardFormData;
  features: FeatureRow[];
  summaryInsights: SummaryInsights;
  useCases: UseCaseRow[];
  basicInfo: BasicInfoRow[];
  generatedData: any | null;
}

export interface BattlecardStructuredData {
  title: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  status: 'draft' | 'published';
  created_by: string;
  companies: Array<{
    id: string;
    company_position: number;
    vendor_id?: string;
    name: string;
    founded: string;
    headquarters: string;
  }>;
  basic_info: Array<{
    id: string;
    category: string;
    company1_value: string;
    company2_value: string;
    sort_order: number;
  }>;
  features: Array<{
    id: string;
    feature_name: string;
    company1_value: string;
    company2_value: string;
    sort_order: number;
  }>;
  use_cases: Array<{
    id: string;
    use_case: string;
    best_fit: string;
    sort_order: number;
  }>;
  insights: Array<{
    id: string;
    company_position: number;
    insight_text: string;
  }>;
}

export interface BattlecardTableRow {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  company1_name?: string;
  company2_name?: string;
}