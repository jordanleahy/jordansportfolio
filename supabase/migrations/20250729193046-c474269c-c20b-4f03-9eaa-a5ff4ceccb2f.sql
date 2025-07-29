-- Drop the existing view and recreate it without SECURITY DEFINER
DROP VIEW user_roles_with_email;

-- Create the view properly with RLS enforcement
CREATE VIEW user_roles_with_email AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  p.email,
  p.full_name
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.user_id;

-- Enable RLS on the view to inherit policies from underlying tables
ALTER VIEW user_roles_with_email SET (security_invoker = true);