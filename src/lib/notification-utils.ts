import { supabase } from '@/integrations/supabase/client';

export async function getSignerUserIds(): Promise<string[]> {
  // Get users who have digital signatures (lanh_dao, ke_toan_truong)
  const { data } = await supabase
    .from('digital_signatures')
    .select('user_id')
    .eq('is_active', true);
  
  return data ? [...new Set(data.map(d => d.user_id))] : [];
}

export async function notifySigners(
  voucherId: string,
  voucherType: string,
  voucherLabel: string,
  creatorName: string
) {
  const signerIds = await getSignerUserIds();
  if (signerIds.length === 0) return;

  const notifications = signerIds.map(userId => ({
    user_id: userId,
    type: 'sign_request' as const,
    title: 'Chứng từ mới cần ký',
    message: `${creatorName} đã tạo ${voucherLabel} số ${voucherId}. Vui lòng ký duyệt.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  }));

  await supabase.from('notifications').insert(notifications);
}

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
    title: 'Chứng từ đã được ký duyệt',
    message: `${signerName} đã ký duyệt ${voucherLabel} số ${voucherId}.`,
    related_voucher_id: voucherId,
    related_voucher_type: voucherType,
  });
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

const voucherTypeLabels: Record<string, string> = {
  'thu': 'Phiếu thu',
  'chi': 'Phiếu chi',
  'tham-hoi': 'Phiếu thăm hỏi',
  'de-nghi': 'Đề nghị thanh toán',
};

export function getVoucherLabel(type: string): string {
  return voucherTypeLabels[type] || type;
}
