-- Create a view that joins user_roles with profiles to show emails safely
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