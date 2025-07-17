-- Update job targets with working ATS URLs
UPDATE job_targets SET 
  url = 'https://jobs.greenhouse.io/embed/company_list',
  selector = '.company-item'
WHERE name = 'Greenhouse Jobs Board';

UPDATE job_targets SET 
  url = 'https://jobs.lever.co/',
  selector = '.posting-row'
WHERE name = 'Lever Jobs Board';

-- Add specific company targets that we know work
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) VALUES
('GitHub Greenhouse', 'https://boards.greenhouse.io/github', 'greenhouse', '.opening', true),
('Dropbox Greenhouse', 'https://jobs.dropbox.com/all-jobs', 'greenhouse', '.opening', true),
('Coinbase Greenhouse', 'https://www.coinbase.com/careers/positions', 'greenhouse', '.opening', true);