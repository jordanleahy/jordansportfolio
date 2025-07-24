export interface CompanyInfo {
  name: string;
  founded: string;
  headquarters: string;
  companyType?: string;
  funding?: string;
  investors?: string;
  employeeSize?: string;
  deliveryModel?: string;
  targetCustomers?: string;
  primarySolutions?: string;
  aiCore?: string;
  ehrIntegration?: string;
  keyBenefits: string[];
  uniqueStrengths: string[];
  clientBase?: string;
  certifications?: string;
  awards?: string;
  location?: string;
}

export interface FeatureComparison {
  feature: string;
  company1: boolean | string;
  company2: boolean | string;
}

export interface UseCase {
  useCase: string;
  bestFit: string;
}

export interface ComparisonData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  company1: CompanyInfo;
  company2: CompanyInfo;
  features: FeatureComparison[];
  summaryInsights: {
    company1: string;
    company2: string;
  };
  useCases: UseCase[];
}