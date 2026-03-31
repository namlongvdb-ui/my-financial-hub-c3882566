
-- Tối ưu RLS cho digital_signatures: chỉ admin mới được tạo/cập nhật chữ ký số
DROP POLICY IF EXISTS "Admin can manage signatures" ON public.digital_signatures;
DROP POLICY IF EXISTS "Admin can update signatures" ON public.digital_signatures;

CREATE POLICY "Admin can insert signatures"
  ON public.digital_signatures FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update signatures"
  ON public.digital_signatures FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tối ưu RLS cho pending_vouchers: chỉ người tạo hoặc người có quyền ký mới thấy
DROP POLICY IF EXISTS "Authenticated users can view pending vouchers" ON public.pending_vouchers;
DROP POLICY IF EXISTS "Authenticated users can insert pending vouchers" ON public.pending_vouchers;
DROP POLICY IF EXISTS "Signers can update pending vouchers" ON public.pending_vouchers;
DROP POLICY IF EXISTS "Admin and creator can delete pending vouchers" ON public.pending_vouchers;

CREATE POLICY "Authenticated can view pending vouchers"
  ON public.pending_vouchers FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can insert pending vouchers"
  ON public.pending_vouchers FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Signer roles can update pending vouchers"
  ON public.pending_vouchers FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'lanh_dao') OR
    public.has_role(auth.uid(), 'ke_toan') OR
    public.has_role(auth.uid(), 'phu_trach_dia_ban') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin or creator can delete pending vouchers"
  ON public.pending_vouchers FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid()::text = created_by
  );
