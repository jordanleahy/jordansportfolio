-- Drop job-related tables (optional - run only if you want to clean up database)

-- Drop job applications table (just created)
DROP TABLE IF EXISTS public.job_applications;

-- Drop existing job monitoring tables
DROP TABLE IF EXISTS public.job_notifications;
DROP TABLE IF EXISTS public.job_bookmarks;  
DROP TABLE IF EXISTS public.job_monitoring_state;
DROP TABLE IF EXISTS public.job_monitoring_config;
DROP TABLE IF EXISTS public.job_targets;
DROP TABLE IF EXISTS public.jobs;