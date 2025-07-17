-- Delete all job targets except Greenhouse-related ones
DELETE FROM job_targets 
WHERE name NOT IN ('Greenhouse', 'BambooHR Jobs Board');

-- Also clean up any related job monitoring state for deleted targets
DELETE FROM job_monitoring_state 
WHERE target_id NOT IN (
  SELECT id FROM job_targets 
  WHERE name IN ('Greenhouse', 'BambooHR Jobs Board')
);

-- Clean up job notifications for deleted targets
DELETE FROM job_notifications 
WHERE target_id NOT IN (
  SELECT id FROM job_targets 
  WHERE name IN ('Greenhouse', 'BambooHR Jobs Board')
);