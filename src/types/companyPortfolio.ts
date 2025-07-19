export interface CompanyPortfolio {
  id: string;
  user_id: string;
  job_application_id: string;
  company_name: string;
  company_slug: string;
  generated_content?: any;
  cover_letter?: string;
  custom_video_url?: string;
  status: 'draft' | 'completed' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CompanyPortfolioInput {
  job_application_id: string;
  company_name: string;
  company_slug: string;
  generated_content?: any;
  cover_letter?: string;
  custom_video_url?: string;
  status?: 'draft' | 'completed' | 'published';
}

export interface GeneratedContent {
  hero_section?: {
    headline: string;
    subheadline: string;
    value_proposition: string;
  };
  relevant_projects?: {
    project_id: string;
    relevance_score: number;
    customized_description: string;
  }[];
  skills_alignment?: {
    skill: string;
    relevance: string;
    examples: string[];
  }[];
  company_analysis?: {
    mission_alignment: string;
    culture_fit: string;
    growth_opportunities: string;
  };
}