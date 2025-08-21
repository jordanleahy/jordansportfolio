export type UseCaseComplexity = 'simple' | 'medium' | 'complex';
export type UseCaseStatus = 'draft' | 'published' | 'archived';

export interface UseCase {
  id: string;
  title: string;
  description: string;
  category?: string;
  industry?: string;
  complexity: UseCaseComplexity;
  target_audience?: string;
  business_value?: string;
  technical_requirements: string[];
  tags: string[];
  status: UseCaseStatus;
  featured: boolean;
  sort_order: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUseCase {
  title: string;
  description: string;
  category?: string;
  industry?: string;
  complexity?: UseCaseComplexity;
  target_audience?: string;
  business_value?: string;
  technical_requirements?: string[];
  tags?: string[];
  status?: UseCaseStatus;
  featured?: boolean;
  sort_order?: number;
}

export interface UpdateUseCase extends Partial<CreateUseCase> {
  id: string;
}

export interface UseCaseFilters {
  search?: string;
  category?: string;
  industry?: string;
  complexity?: UseCaseComplexity;
  status?: UseCaseStatus;
  featured?: boolean;
}