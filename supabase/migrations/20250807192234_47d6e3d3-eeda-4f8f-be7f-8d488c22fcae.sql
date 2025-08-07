-- Add email column to user_usage_tracking and keep it updated automatically

-- 1) Add the denormalized email column
ALTER TABLE public.user_usage_tracking
ADD COLUMN IF NOT EXISTS user_email text;

-- 2) Function to set the email from auth.users based on user_id
CREATE OR REPLACE FUNCTION public.set_user_usage_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  NEW.user_email = v_email;
  RETURN NEW;
END;
$$;

-- 3) Trigger to populate on insert and when user_id changes
DROP TRIGGER IF EXISTS trg_set_user_usage_email ON public.user_usage_tracking;
CREATE TRIGGER trg_set_user_usage_email
BEFORE INSERT OR UPDATE OF user_id ON public.user_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.set_user_usage_email();

-- 4) Backfill existing rows
UPDATE public.user_usage_tracking u
SET user_email = a.email
FROM auth.users a
WHERE a.id = u.user_id;