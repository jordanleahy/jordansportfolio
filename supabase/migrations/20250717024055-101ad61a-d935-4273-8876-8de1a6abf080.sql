-- Update the default regex pattern to match any job title
UPDATE job_monitoring_config 
SET title_regex = '.*'  -- Matches any job title
WHERE title_regex = '(?i)product\s+designer';

-- Also update the date selector to be more flexible for recent jobs
UPDATE job_monitoring_config 
SET date_selector = '.date, .posted-date, .publish-date, [data-date], .job-date'
WHERE date_selector = '.publish-date';