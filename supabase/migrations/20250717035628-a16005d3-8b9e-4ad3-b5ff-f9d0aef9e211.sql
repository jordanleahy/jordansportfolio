-- Update BambooHR to target their embedded Greenhouse iframe
UPDATE job_targets 
SET 
  url = 'https://boards.greenhouse.io/embed/job_board?for=bamboohr17',
  selector = '.opening'
WHERE ats_platform = 'bamboohr';