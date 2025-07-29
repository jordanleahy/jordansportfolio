-- Add user 3e7858df-9613-4285-98d2-ffb818c26f6d to the profiles table
INSERT INTO public.profiles (user_id)
VALUES ('3e7858df-9613-4285-98d2-ffb818c26f6d')
ON CONFLICT (user_id) DO NOTHING;