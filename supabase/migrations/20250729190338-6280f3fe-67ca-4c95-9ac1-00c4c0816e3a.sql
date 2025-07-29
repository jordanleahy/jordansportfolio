-- Assign user role to the new user tes+1t@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('536c36ee-2421-4413-b701-239d464630cc', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;