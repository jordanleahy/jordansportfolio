export interface Job {
  id: string;
  title: string;
  company: string;
  platform: string;
  location: string;
  date_posted: string;
  application_url: string;
  description: string;
  job_type: string;
  salary?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}