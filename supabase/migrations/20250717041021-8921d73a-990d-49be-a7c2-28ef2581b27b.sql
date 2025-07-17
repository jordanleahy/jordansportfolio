-- Delete the BambooHR Jobs Board target
DELETE FROM job_targets 
WHERE name = 'BambooHR Jobs Board';

-- Clean up any related job monitoring state for this target
DELETE FROM job_monitoring_state 
WHERE target_id NOT IN (
  SELECT id FROM job_targets
);

-- Clean up job notifications for this target
DELETE FROM job_notifications 
WHERE target_id NOT IN (
  SELECT id FROM job_targets
);