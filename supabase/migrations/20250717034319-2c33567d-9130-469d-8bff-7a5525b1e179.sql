-- Update Workable job target with correct selectors
UPDATE job_targets 
SET 
  selector = 'li.whr-item',
  url = 'https://jobs.workable.com/'
WHERE ats_platform = 'workable';

-- If no workable target exists, insert it
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) 
SELECT 'Workable Jobs Board', 'https://jobs.workable.com/', 'workable', 'li.whr-item', true
WHERE NOT EXISTS (SELECT 1 FROM job_targets WHERE ats_platform = 'workable');