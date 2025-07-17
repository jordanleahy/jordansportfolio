export interface JobTarget {
  id: string;
  name: string;
  url: string;
  ats_platform: string;
  selector: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobMonitoringConfig {
  id: string;
  user_id: string;
  title_regex: string;
  date_selector: string;
  poll_interval_minutes: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface JobMonitoringState {
  id: string;
  target_id: string;
  last_scraped_at?: string;
  last_job_count: number;
  last_jobs_hash?: string;
  error_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface JobNotification {
  id: string;
  job_id: string;
  target_id: string;
  notification_type: string;
  sent_at: string;
  created_at: string;
}

export type ATSPlatform = 'greenhouse' | 'lever' | 'workable' | 'breezy' | 'jazzhr' | 'bamboohr' | 'smartrecruiters' | 'recruitee';

export interface ATSConfig {
  platform: ATSPlatform;
  selector: string;
  titleSelector?: string;
  companySelector?: string;
  locationSelector?: string;
  dateSelector?: string;
  linkSelector?: string;
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  date_posted: string;
  application_url: string;
  description: string;
  platform: string;
}