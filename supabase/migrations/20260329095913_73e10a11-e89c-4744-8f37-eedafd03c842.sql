
-- Step 1: Drop all dependent policies
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage signatures" ON public.digital_signatures;
DROP POLICY IF EXISTS "Admin can update signatures" ON public.digital_signatures;
DROP POLICY IF EXISTS "Signers can update pending vouchers" ON public.pending_vouchers;

-- Step 2: Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 3: Update existing data
UPDATE public.user_roles SET role = 'ke_toan' WHERE role = 'ke_toan_truong';

-- Step 4: Rename old enum and create new one
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'lanh_dao', 'nguoi_lap');

-- Step 5: Update column to new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING (CASE 
    WHEN role::text = 'ke_toan' THEN 'nguoi_lap'::public.app_role
    WHEN role::text = 'ke_toan_truong' THEN 'nguoi_lap'::public.app_role
    ELSE role::text::public.app_role
  END);

-- Step 6: Drop old enum
DROP TYPE public.app_role_old;

-- Step 7: Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 8: Recreate all policies
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage signatures" ON public.digital_signatures FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update signatures" ON public.digital_signatures FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Signers can update pending vouchers" ON public.pending_vouchers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'lanh_dao'::app_role) OR (auth.uid() = created_by));
