-- Insert admin role for the current user
-- Replace this UUID with your actual user ID from the auth.users table
INSERT INTO public.user_roles (user_id, role) 
VALUES ('3e7858df-9613-4285-98d2-ffb818c26f6d', 'admin');