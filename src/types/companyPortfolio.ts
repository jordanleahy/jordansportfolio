
export interface CompanyPortfolio {
  id: string;
  user_id: string;
  job_application_id: string;
  company_name: string;
  company_slug: string;
  generated_content?: GeneratedContent;
  cover_letter?: string;
  custom_video_url?: string;
  custom_top_video_url?: string;
  status: 'draft' | 'completed' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CompanyPortfolioInput {
  job_application_id: string;
  company_name: string;
  company_slug: string;
  generated_content?: GeneratedContent;
  cover_letter?: string;
  custom_video_url?: string;
  custom_top_video_url?: string;
  status?: 'draft' | 'completed' | 'published';
}

export interface StructuredCoverLetter {
  opening_hook: string;
  key_achievements: string[];
  strategic_fit: string[];
  call_to_action: string;
}

export interface GeneratedContent {
  cover_letter: string | StructuredCoverLetter;
}
