import { supabase } from '@/integrations/supabase/client';

// Get user IDs by role
export async function getUserIdsByRole(role: 'admin' | 'lanh_dao' | 'ke_toan_truong' | 'ke_toan'): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role);
  return data ? data.map(d => d.user_id) : [];
}

export async function getSignerUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('digital_signatures')
    .select('user_id')
    .eq('is_active', true);
  
  return data ? [...new Set(data.map(d => d.user_id))] : [];
}

// Step 1: Kế toán tạo chứng từ → thông báo kế toán trưởng
export async function notifyChiefAccountant(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  const chiefIds = await getUserIdsByRole('ke_toan_truong');
  if (chiefIds.length === 0) return;

  const notifications = chiefIds.map(userId => ({
    user_id: userId,
    type: 'sign_request' as const,
    title: 'Chứng từ mới cần ký duyệt',
    message: `${creatorName} đã tạo ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  }));

  await supabase.from('notifications').insert(notifications);
}

// Step 2: Kế toán trưởng ký xong → thông báo lãnh đạo
export async function notifyLeader(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  chiefAccountantName: string
) {
  const leaderIds = await getUserIdsByRole('lanh_dao');
  if (leaderIds.length === 0) return;

  const notifications = leaderIds.map(userId => ({
    user_id: userId,
    type: 'sign_request' as const,
    title: 'Chứng từ cần ký duyệt (Kế toán trưởng đã ký)',
    message: `${chiefAccountantName} đã ký duyệt ${voucherLabel} số ${voucherId}. Chờ lãnh đạo ký.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  }));

  await supabase.from('notifications').insert(notifications);
}

// Step 3: Lãnh đạo ký xong → thông báo kế toán (người tạo)
export async function notifyCreator(
  creatorId: string,
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  signerName: string
) {
  await supabase.from('notifications').insert({
    user_id: creatorId,
    type: 'signed',
    title: 'Chứng từ đã được duyệt hoàn tất',
    message: `${signerName} đã ký duyệt ${voucherLabel} số ${voucherId}. Chứng từ hoàn thành.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  });
}

// Legacy: notify all signers (kept for backward compatibility)
export async function notifySigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  // Now only notify chief accountant first (step 1)
  await notifyChiefAccountant(voucherId, voucherType, voucherLabel, creatorName);
}

export async function submitVoucherForSigning(
  voucherId: string,
  voucherType: string,
  voucherData: Record<string, any>,
  createdBy: string
) {
  await supabase.from('pending_vouchers').insert({
    voucher_id: voucherId,
    voucher_type: voucherType,
    voucher_data: voucherData,
    created_by: createdBy,
    status: 'pending',
  });
}

// Determine the signing step based on who has signed
export async function getSigningStep(voucherId: string): Promise<'pending' | 'chief_signed' | 'fully_signed'> {
  const { data: sigs } = await supabase
    .from('voucher_signatures')
    .select('signer_id')
    .eq('voucher_id', voucherId);

  if (!sigs || sigs.length === 0) return 'pending';

  const signerIds = new Set(sigs.map(s => s.signer_id));
  
  const chiefIds = await getUserIdsByRole('ke_toan_truong');
  const leaderIds = await getUserIdsByRole('lanh_dao');

  const chiefSigned = chiefIds.some(id => signerIds.has(id));
  const leaderSigned = leaderIds.some(id => signerIds.has(id));

  if (chiefSigned && leaderSigned) return 'fully_signed';
  if (chiefSigned) return 'chief_signed';
  return 'pending';
}

const voucherTypeLabels: Record<string, string> = {
  'thu': 'Phiếu thu',
  'chi': 'Phiếu chi',
  'tham-hoi': 'Phiếu thăm hỏi',
  'de-nghi': 'Đề nghị thanh toán',
};

export function getVoucherLabel(type: string): string {
  return voucherTypeLabels[type] || type;
}
