-- Update job targets to use only the primary selectors for reliable scraping
UPDATE job_targets 
SET selector = '.job-listing,.career-opening,.position,.job-card'
WHERE selector LIKE '%job-listing%';