
-- Allow service role to delete profiles (needed by admin-manage-user edge function)
CREATE POLICY "Service role can delete profiles"
ON public.profiles
FOR DELETE
TO service_role
USING (true);

-- Allow service role to delete digital signatures
CREATE POLICY "Service role can delete signatures"
ON public.digital_signatures
FOR DELETE
TO service_role
USING (true);
