-- Test inserting a simple job directly to verify basic functionality
INSERT INTO public.jobs (
  title,
  company,
  platform, 
  location,
  date_posted,
  application_url,
  description,
  job_type,
  is_active
) VALUES (
  'Test Manual Job',
  'Test Company',
  'manual',
  'Remote',
  CURRENT_DATE,
  'https://example.com/test-manual-job-' || extract(epoch from now()),
  'This is a manually inserted test job to verify database insertion works',
  'Full-time',
  true
) RETURNING id, title, company;