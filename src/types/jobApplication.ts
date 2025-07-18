export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_description: string;
  resume_link?: string;
  cover_letter_link?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationInput {
  company_name: string;
  job_description: string;
  resume_link?: string;
  cover_letter_link?: string;
}