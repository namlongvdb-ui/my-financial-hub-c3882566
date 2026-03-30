import { supabase } from '@/integrations/supabase/client';

// Get user IDs by role
export async function getUserIdsByRole(role: 'admin' | 'lanh_dao' | 'ke_toan' | 'nguoi_lap'): Promise<string[]> {
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

// Người lập tạo chứng từ → thông báo lãnh đạo
export async function notifyLeader(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  const [leaderIds, accountantIds] = await Promise.all([
    getUserIdsByRole('lanh_dao'),
    getUserIdsByRole('ke_toan'),
  ]);
  const signerIds = [...new Set([...leaderIds, ...accountantIds])];
  if (signerIds.length === 0) return;

  const notifications = signerIds.map(userId => ({
    user_id: userId,
    type: 'sign_request' as const,
    title: 'Chứng từ mới cần ký duyệt',
    message: `${creatorName} đã tạo ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  }));

  await supabase.from('notifications').insert(notifications);
}

// Lãnh đạo ký xong → thông báo người lập (người tạo)
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

// Notify signers (leader) when voucher is submitted
export async function notifySigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  await notifyLeader(voucherId, voucherType, voucherLabel, creatorName);
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

// Determine the signing step
export async function getSigningStep(voucherId: string): Promise<'pending' | 'fully_signed'> {
  const { data: sigs } = await supabase
    .from('voucher_signatures')
    .select('signer_id')
    .eq('voucher_id', voucherId);

  if (!sigs || sigs.length === 0) return 'pending';

  const signerIdsSet = new Set(sigs.map(s => s.signer_id));
  const [leaderIds, accountantIds] = await Promise.all([
    getUserIdsByRole('lanh_dao'),
    getUserIdsByRole('ke_toan'),
  ]);
  const allSignerRoleIds = [...leaderIds, ...accountantIds];
  const signerSigned = allSignerRoleIds.some(id => signerIdsSet.has(id));

  if (signerSigned) return 'fully_signed';
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
