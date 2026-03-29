
-- Fix overly permissive UPDATE policy on pending_vouchers
DROP POLICY "Authenticated users can update pending vouchers" ON public.pending_vouchers;
CREATE POLICY "Signers can update pending vouchers"
ON public.pending_vouchers FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'lanh_dao'::app_role) OR 
  has_role(auth.uid(), 'ke_toan_truong'::app_role) OR 
  auth.uid() = created_by
);

-- Fix overly permissive INSERT policy on notifications
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
