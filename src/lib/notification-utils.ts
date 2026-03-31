import { supabase } from '@/integrations/supabase/client';

// Get user IDs by role
export async function getUserIdsByRole(role: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role as any);
  return data ? data.map(d => d.user_id) : [];
}

export async function getSignerUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('digital_signatures')
    .select('user_id')
    .eq('is_active', true);
  
  return data ? [...new Set(data.map(d => d.user_id))] : [];
}

/**
 * Workflow luân chuyển chứng từ:
 * 1. Người lập tạo chứng từ → thông báo kế toán (thu/chi/đề nghị) hoặc phụ trách địa bàn (thăm hỏi)
 * 2. Kế toán / phụ trách địa bàn ký xong → thông báo lãnh đạo
 * 3. Lãnh đạo ký xong → thông báo người lập để in chứng từ
 */

// Step 1: Người lập tạo chứng từ → thông báo kế toán hoặc phụ trách địa bàn (KHÔNG lãnh đạo)
export async function notifyFirstSigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  let signerIds: string[] = [];

  if (voucherType === 'tham-hoi') {
    // Phiếu thăm hỏi: thông báo phụ trách địa bàn trước
    signerIds = await getUserIdsByRole('phu_trach_dia_ban');
  } else {
    // Thu/chi/đề nghị: thông báo kế toán trước
    signerIds = await getUserIdsByRole('ke_toan');
  }

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

// Step 2: Kế toán / phụ trách địa bàn ký xong → thông báo lãnh đạo
export async function notifyLeaderAfterFirstSign(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  signerName: string
) {
  const leaderIds = await getUserIdsByRole('lanh_dao');
  if (leaderIds.length === 0) return;

  const roleName = voucherType === 'tham-hoi' ? 'Phụ trách địa bàn' : 'Kế toán';

  const notifications = leaderIds.map(userId => ({
    user_id: userId,
    type: 'sign_request' as const,
    title: 'Chứng từ đã qua bước duyệt đầu',
    message: `${roleName} ${signerName} đã ký ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  }));

  await supabase.from('notifications').insert(notifications);
}

// Step 3: Lãnh đạo ký xong → thông báo người lập để in chứng từ
export async function notifyCreatorToprint(
  creatorId: string,
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  signerName: string
) {
  await supabase.from('notifications').insert({
    user_id: creatorId,
    type: 'ready_to_print',
    title: 'Chứng từ đã được duyệt hoàn tất',
    message: `Lãnh đạo ${signerName} đã ký duyệt ${voucherLabel} số ${voucherId}. Bạn có thể in chứng từ.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  });
}

// Legacy aliases
export async function notifySigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  await notifyFirstSigners(voucherId, voucherType, voucherLabel, creatorName);
}

export async function notifyCreator(
  creatorId: string,
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  signerName: string
) {
  await notifyCreatorToprint(creatorId, voucherId, voucherType, voucherLabel, signerName);
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

/**
 * Determine signing step for a voucher:
 * - 'pending': chưa có ai ký
 * - 'first_signed': kế toán/phụ trách đã ký, chờ lãnh đạo
 * - 'fully_signed': lãnh đạo đã ký, hoàn tất
 */
export async function getSigningStep(
  voucherId: string,
  voucherType: string
): Promise<'pending' | 'first_signed' | 'fully_signed'> {
  const { data: sigs } = await supabase
    .from('voucher_signatures')
    .select('signer_id')
    .eq('voucher_id', voucherId);

  if (!sigs || sigs.length === 0) return 'pending';

  const signerIdsSet = new Set(sigs.map(s => s.signer_id));
  
  const leaderIds = await getUserIdsByRole('lanh_dao');
  const leaderSigned = leaderIds.some(id => signerIdsSet.has(id));
  if (leaderSigned) return 'fully_signed';

  // Check if first signer (kế toán or phụ trách) has signed
  if (voucherType === 'tham-hoi') {
    const areaRepIds = await getUserIdsByRole('phu_trach_dia_ban');
    if (areaRepIds.some(id => signerIdsSet.has(id))) return 'first_signed';
  } else {
    const accountantIds = await getUserIdsByRole('ke_toan');
    if (accountantIds.some(id => signerIdsSet.has(id))) return 'first_signed';
  }

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
