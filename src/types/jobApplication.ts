export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_description: string;
  job_description_link?: string;
  resume_link?: string;
  cover_letter_link?: string;
  resume_text?: string;
  attachment_url?: string;
  attachment_filename?: string;
  attachment_type?: string;
  submitted?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationInput {
  company_name: string;
  job_description: string;
  job_description_link?: string;
  resume_link?: string;
  cover_letter_link?: string;
  resume_text?: string;
  attachment_url?: string;
  attachment_filename?: string;
  attachment_type?: string;
  submitted?: string;
}