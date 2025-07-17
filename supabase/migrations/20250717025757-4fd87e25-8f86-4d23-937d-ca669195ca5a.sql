-- Phase 1: Clear existing job targets and insert the 15 ATS vendor career pages
DELETE FROM job_targets;

-- Insert the 15 ATS vendor career pages with robust selectors
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) VALUES
('Transformify', 'https://www.transformify.org/jobs', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Greenhouse', 'https://www.greenhouse.com/careers', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Manatal', 'https://www.careers-page.com/manatal', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('BambooHR', 'https://www.bamboohr.com/careers', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('ClearCompany', 'https://www.clearcompany.com/careers', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Workable', 'https://jobs.workable.com/', 'workable', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Pinpoint', 'https://workwithus.pinpointhq.com/', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('iCIMS', 'https://careers.icims.com/', 'icims', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Lever', 'https://www.lever.co/careers', 'lever', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('JazzHR', 'https://www.jazzhr.com/jazzhr-careers/', 'jazzhr', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Breezy HR', 'https://jobs.breezy.hr/', 'breezy', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Avature', 'https://careers.avature.net/en_US/main/Dashboard', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Jobvite', 'https://www.jobvite.com/company/', 'jobvite', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('SmartRecruiters', 'https://www.smartrecruiterscareers.com/', 'smartrecruiters', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true),
('Trakstar', 'https://trakstar.hire.trakstar.com/', 'custom', '.job-listing,.career-opening,.position,.job-card,[data-job],.posting,.opportunity,.role', true);

-- Phase 2: Reset monitoring state for clean slate
DELETE FROM job_monitoring_state;

-- Update job monitoring config to catch all job types (not just product designer)
UPDATE job_monitoring_config 
SET title_regex = '.*'
WHERE title_regex = '(?i)product\s+designer' OR title_regex = '.*';