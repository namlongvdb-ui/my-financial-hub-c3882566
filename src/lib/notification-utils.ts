import { notificationsApi, rolesApi, profilesApi, voucherSignaturesApi, pendingVouchersApi, digitalSignaturesApi } from '@/lib/api-client';

// Get user IDs by role
export async function getUserIdsByRole(role: string): Promise<string[]> {
  const { data } = await rolesApi.getAll();
  return data ? data.filter((d: any) => d.role === role).map((d: any) => d.user_id) : [];
}

// Get area rep user IDs for a specific area
export async function getAreaRepsByArea(areaName: string): Promise<string[]> {
  const areaRepIds = await getUserIdsByRole('phu_trach_dia_ban');
  if (areaRepIds.length === 0) return [];

  const { data: profiles } = await profilesApi.getAll();

  const filtered = (profiles || []).filter((p: any) => {
    if (!p.assigned_area || !areaRepIds.includes(p.user_id)) return false;
    const areas = p.assigned_area.split(',').map((a: string) => a.trim());
    return areas.some((area: string) => areaName.includes(area));
  });

  return filtered.map((p: any) => p.user_id);
}

export async function getSignerUserIds(): Promise<string[]> {
  const { data } = await digitalSignaturesApi.get(undefined, true);
  return data ? [...new Set(data.map((d: any) => d.user_id))] : [];
}

// Step 1: Người lập tạo chứng từ → thông báo kế toán hoặc phụ trách địa bàn
export async function notifyFirstSigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string,
  areaName?: string
) {
  let signerIds: string[] = [];

  if (voucherType === 'tham-hoi') {
    if (areaName) {
      signerIds = await getAreaRepsByArea(areaName);
    }
    if (signerIds.length === 0) {
      signerIds = await getUserIdsByRole('phu_trach_dia_ban');
    }
  } else {
    signerIds = await getUserIdsByRole('ke_toan');
  }

  if (signerIds.length === 0) return;

  for (const userId of signerIds) {
    await notificationsApi.create({
      userId,
      type: 'sign_request',
      title: 'Chứng từ mới cần ký duyệt',
      message: `${creatorName} đã tạo ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
      relatedVoucherId: voucherId,
      relatedVoucherType: voucherType,
    });
  }
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

  for (const userId of leaderIds) {
    await notificationsApi.create({
      userId,
      type: 'sign_request',
      title: 'Chứng từ đã qua bước duyệt đầu',
      message: `${roleName} ${signerName} đã ký ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
      relatedVoucherId: voucherId,
      relatedVoucherType: voucherType,
    });
  }
}

// Step 3: Lãnh đạo ký xong → thông báo người lập để in chứng từ
export async function notifyCreatorToprint(
  creatorId: string,
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  signerName: string
) {
  await notificationsApi.create({
    userId: creatorId,
    type: 'ready_to_print',
    title: 'Chứng từ đã được duyệt hoàn tất',
    message: `Lãnh đạo ${signerName} đã ký duyệt ${voucherLabel} số ${voucherId}. Bạn có thể in chứng từ.`,
    relatedVoucherId: voucherId,
    relatedVoucherType: voucherType,
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
  await pendingVouchersApi.create({
    voucherId,
    voucherType,
    voucherData,
    createdBy,
  });
}

export async function getSigningStep(
  voucherId: string,
  voucherType: string
): Promise<'pending' | 'first_signed' | 'fully_signed'> {
  const { data: sigs } = await voucherSignaturesApi.get(voucherId);

  if (!sigs || sigs.length === 0) return 'pending';

  const signerIdsSet = new Set(sigs.map((s: any) => s.signer_id));
  
  const leaderIds = await getUserIdsByRole('lanh_dao');
  const leaderSigned = leaderIds.some(id => signerIdsSet.has(id));
  if (leaderSigned) return 'fully_signed';

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
