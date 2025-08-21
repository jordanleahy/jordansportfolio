export type UseCaseComplexity = 'simple' | 'medium' | 'complex';
export type UseCaseStatus = 'draft' | 'published' | 'archived';

// Case study specific interfaces
export interface Challenge {
  type: 'problem' | 'need';
  title: string;
  items: string[];
}

export interface TeamMember {
  icon: string;
  title: string;
  description: string;
  items: string[];
}

export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
  items?: string[];
  quote?: {
    text: string;
    author: string;
  };
  image?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Reflection {
  type: 'success' | 'challenge' | 'learning';
  title: string;
  items: string[];
}

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
  
  // Hero section
  hero_image?: string;
  hero_image_alt?: string;
  role?: string;
  role_details?: string;
  timeline_value?: string;
  timeline_details?: string;
  
  // Figma integration
  figma_presentation_enabled?: boolean;
  figma_presentation_url?: string;
  figma_presentation_title?: string;
  
  // Final product
  prototype_url?: string;
  final_product_description?: string;
  
  // Problem section
  problem_title?: string;
  problem_description?: string;
  challenges?: Challenge[];
  
  // Team section
  team_members?: TeamMember[];
  
  // Process section
  process_title?: string;
  process_steps?: ProcessStep[];
  
  // Solution section
  solution_title?: string;
  features?: Feature[];
  
  // Outcomes section
  outcomes_title?: string;
  user_feedback?: {
    quote: string;
    author: string;
  };
  
  // Reflection section
  reflection_title?: string;
  reflections?: Reflection[];
  
  // Visual assets
  visual_artifacts?: {
    designArtifacts: string[];
    processDocumentation: string[];
  };
  
  // CTA
  cta_title?: string;
  
  // Public URL
  slug?: string;
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