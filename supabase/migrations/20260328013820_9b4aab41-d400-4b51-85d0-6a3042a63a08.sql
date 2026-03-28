
-- Prevent deleting admin role from admin user
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if trying to delete the admin role
  IF OLD.role = 'admin' THEN
    -- Check if the user is the original admin (by username)
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = OLD.user_id AND username = 'admin'
    ) THEN
      RAISE EXCEPTION 'Không thể xoá quyền quản trị của tài khoản admin mặc định';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_admin_role_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role();
