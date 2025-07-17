-- Add BambooHR target if it doesn't exist  
INSERT INTO job_targets (name, url, ats_platform, selector, is_active) 
SELECT 'BambooHR Jobs Board', 'https://boards.greenhouse.io/embed/job_board?for=bamboohr17', 'bamboohr', '.opening', true
WHERE NOT EXISTS (SELECT 1 FROM job_targets WHERE ats_platform = 'bamboohr' AND url LIKE '%bamboohr%');