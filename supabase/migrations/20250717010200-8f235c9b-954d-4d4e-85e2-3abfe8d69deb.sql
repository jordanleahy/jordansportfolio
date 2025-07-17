-- Clear existing company-specific job targets
DELETE FROM job_targets;

-- Add ATS platform-wide targets for comprehensive job scraping
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) VALUES
-- Greenhouse platform-wide
('Greenhouse Jobs Board', 'https://boards.greenhouse.io/jobs', 'greenhouse', '.opening', true),

-- Lever platform-wide 
('Lever Jobs Board', 'https://jobs.lever.co/', 'lever', '.posting', true),

-- Workable platform-wide
('Workable Jobs Board', 'https://apply.workable.com/', 'workable', '.job-item', true),

-- SmartRecruiters platform-wide
('SmartRecruiters Jobs Board', 'https://jobs.smartrecruiters.com/', 'smartrecruiters', '.jobposting-list-item', true),

-- BambooHR platform-wide
('BambooHR Jobs Board', 'https://bamboohr.com/jobs/', 'bamboohr', '.job-card', true);

-- Update monitoring state table to handle new targets
UPDATE job_monitoring_state SET 
  last_scraped_at = NULL,
  last_job_count = 0,
  error_count = 0,
  last_error = NULL
WHERE target_id NOT IN (SELECT id FROM job_targets);