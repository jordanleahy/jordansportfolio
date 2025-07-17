-- Update Workable to use the search page which has actual job listings
UPDATE job_targets 
SET 
  url = 'https://jobs.workable.com/search/united%20states%20of%20america/product-designer-jobs',
  selector = 'li'
WHERE ats_platform = 'workable';