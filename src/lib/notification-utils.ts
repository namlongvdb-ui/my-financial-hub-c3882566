import { supabase } from '@/integrations/supabase/client';

// Get user IDs by role
export async function getUserIdsByRole(role: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role as any);
  return data ? data.map(d => d.user_id) : [];
}

// Get area rep user IDs for a specific area
export async function getAreaRepsByArea(areaName: string): Promise<string[]> {
  const areaRepIds = await getUserIdsByRole('phu_trach_dia_ban');
  if (areaRepIds.length === 0) return [];

  // Lọc theo địa bàn: tên tổ CĐ chứa tên địa bàn (assigned_area)
  // VD: areaName = "Tổ CĐ BP Kế toán, PGD Cao Bằng", assigned_area = "PGD Cao Bằng"
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, assigned_area')
    .in('user_id', areaRepIds)
    .not('assigned_area', 'is', null);

  // Filter: union group name contains the rep's assigned_area
  const filtered = (profiles || []).filter(p => 
    p.assigned_area && areaName.includes(p.assigned_area)
  );

  return profiles ? profiles.map(p => p.user_id) : [];
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
  creatorName: string,
  areaName?: string
) {
  let signerIds: string[] = [];

  if (voucherType === 'tham-hoi') {
    // Phiếu thăm hỏi: chỉ thông báo phụ trách của đúng địa bàn đó
    if (areaName) {
      signerIds = await getAreaRepsByArea(areaName);
    }
    // Fallback: nếu không tìm được phụ trách cho địa bàn cụ thể, thông báo tất cả
    if (signerIds.length === 0) {
      signerIds = await getUserIdsByRole('phu_trach_dia_ban');
    }
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
  creatorName: string,
  areaName?: string
) {
  await notifyFirstSigners(voucherId, voucherType, voucherLabel, creatorName, areaName);
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
