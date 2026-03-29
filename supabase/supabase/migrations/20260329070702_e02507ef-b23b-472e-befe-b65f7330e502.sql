
-- Table for pending vouchers that need signing
CREATE TABLE public.pending_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id text NOT NULL,
  voucher_type text NOT NULL,
  voucher_data jsonb NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  printed_at timestamptz
);

ALTER TABLE public.pending_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pending vouchers"
ON public.pending_vouchers FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert pending vouchers"
ON public.pending_vouchers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pending vouchers"
ON public.pending_vouchers FOR UPDATE TO authenticated
USING (true);

-- Table for notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_voucher_id text,
  related_voucher_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_vouchers;
