import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { signData, hashData, verifySignature, getPrivateKey } from '@/lib/crypto-utils';
import { Transaction } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, PenTool, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SignatureInfo {
  signer_id: string;
  signer_name: string;
  signed_at: string;
  is_valid: boolean | null; // null = not verified yet
  role: string;
}

interface VoucherSignatureProps {
  transaction: Transaction;
  voucherType: 'thu' | 'chi';
  compact?: boolean; // for table row display
}

function buildVoucherDataString(tx: Transaction): string {
  return JSON.stringify({
    voucherNo: tx.voucherNo,
    date: tx.date,
    amount: tx.amount,
    description: tx.description,
    personName: tx.personName,
    type: tx.type,
  });
}

export function VoucherSignatureStatus({ transaction, voucherType }: VoucherSignatureProps) {
  const [signatures, setSignatures] = useState<SignatureInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignatures();
  }, [transaction.id]);

  const fetchSignatures = async () => {
    setLoading(true);
    const { data: sigs } = await supabase
      .from('voucher_signatures')
      .select('signer_id, signed_at')
      .eq('voucher_id', transaction.id)
      .eq('voucher_type', voucherType);

    if (sigs && sigs.length > 0) {
      // Get signer profiles and roles
      const signerIds = sigs.map(s => s.signer_id);
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', signerIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', signerIds),
      ]);

      const infos: SignatureInfo[] = sigs.map(s => {
        const profile = profilesRes.data?.find(p => p.user_id === s.signer_id);
        const role = rolesRes.data?.find(r => r.user_id === s.signer_id);
        return {
          signer_id: s.signer_id,
          signer_name: profile?.full_name || 'Unknown',
          signed_at: s.signed_at,
          is_valid: null,
          role: role?.role || '',
        };
      });
      setSignatures(infos);
    } else {
      setSignatures([]);
    }
    setLoading(false);
  };

  if (loading) return <Badge variant="outline" className="text-xs">...</Badge>;

  if (signatures.length === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Chưa ký
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {signatures.map(sig => (
        <Badge
          key={sig.signer_id}
          variant="outline"
          className="text-xs bg-green-50 text-green-700 border-green-200"
          title={`${sig.signer_name} - ${sig.role === 'lanh_dao' ? 'Lãnh đạo' : sig.role === 'ke_toan_truong' ? 'KTT' : sig.role}`}
        >
          <ShieldCheck className="w-3 h-3 mr-1" />
          {sig.signer_name}
        </Badge>
      ))}
    </div>
  );
}

export function SignVoucherButton({ transaction, voucherType, onSigned }: VoucherSignatureProps & { onSigned?: () => void }) {
  const { user, hasRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; details: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const canSign = hasRole('lanh_dao') || hasRole('ke_toan_truong');

  useEffect(() => {
    if (user && canSign) {
      checkIfSigned();
    }
  }, [user, transaction.id]);

  const checkIfSigned = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('voucher_signatures')
      .select('id')
      .eq('voucher_id', transaction.id)
      .eq('voucher_type', voucherType)
      .eq('signer_id', user.id)
      .maybeSingle();
    setAlreadySigned(!!data);
  };

  const handleSign = async () => {
    if (!user) return;
    setSigning(true);

    try {
      const privateKey = getPrivateKey(user.id);
      if (!privateKey) {
        toast.error('Không tìm thấy khóa bí mật. Vui lòng liên hệ Admin để tạo chữ ký số.');
        setSigning(false);
        return;
      }

      const dataString = buildVoucherDataString(transaction);
      const dataHash = await hashData(dataString);
      const signature = await signData(privateKey, dataString);

      const { error } = await supabase.from('voucher_signatures').insert({
        voucher_id: transaction.id,
        voucher_type: voucherType,
        signer_id: user.id,
        signature,
        data_hash: dataHash,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Bạn đã ký phiếu này rồi');
        } else {
          throw error;
        }
      } else {
        toast.success(`Đã ký duyệt phiếu ${transaction.voucherNo}`);
        setAlreadySigned(true);
        onSigned?.();
      }
    } catch (err: any) {
      toast.error(`Lỗi ký: ${err.message}`);
    }
    setSigning(false);
    setDialogOpen(false);
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const { data: sigs } = await supabase
        .from('voucher_signatures')
        .select('signer_id, signature, data_hash')
        .eq('voucher_id', transaction.id)
        .eq('voucher_type', voucherType);

      if (!sigs || sigs.length === 0) {
        setVerifyResult({ valid: false, details: 'Chưa có chữ ký nào trên phiếu này' });
        setVerifying(false);
        return;
      }

      const dataString = buildVoucherDataString(transaction);
      const results: string[] = [];
      let allValid = true;

      for (const sig of sigs) {
        // Get public key
        const { data: sigKey } = await supabase
          .from('digital_signatures')
          .select('public_key')
          .eq('user_id', sig.signer_id)
          .eq('is_active', true)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', sig.signer_id)
          .single();

        const name = profile?.full_name || sig.signer_id;

        if (!sigKey) {
          results.push(`❌ ${name}: Không tìm thấy khóa công khai`);
          allValid = false;
          continue;
        }

        const valid = await verifySignature(sigKey.public_key, sig.signature, dataString);
        if (valid) {
          results.push(`✅ ${name}: Chữ ký hợp lệ`);
        } else {
          results.push(`❌ ${name}: Chữ ký KHÔNG hợp lệ (dữ liệu có thể đã bị thay đổi)`);
          allValid = false;
        }
      }

      setVerifyResult({ valid: allValid, details: results.join('\n') });
    } catch (err: any) {
      setVerifyResult({ valid: false, details: `Lỗi xác thực: ${err.message}` });
    }
    setVerifying(false);
  };

  if (!canSign && !user) return null;

  return (
    <>
      <div className="flex gap-1">
        {canSign && (
          <Button
            size="sm"
            variant={alreadySigned ? 'secondary' : 'default'}
            className={`h-7 text-xs ${alreadySigned ? '' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
            disabled={alreadySigned}
          >
            {alreadySigned ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Đã ký</>
            ) : (
              <><PenTool className="w-3 h-3 mr-1" /> Ký duyệt</>
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); handleVerify(); }}
          disabled={verifying}
        >
          {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
          Xác thực
        </Button>
      </div>

      {/* Verify result tooltip */}
      {verifyResult && (
        <Dialog open={!!verifyResult} onOpenChange={() => setVerifyResult(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {verifyResult.valid ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" /> Chữ ký hợp lệ</>
                ) : (
                  <><XCircle className="w-5 h-5 text-red-600" /> Cảnh báo</>
                )}
              </DialogTitle>
              <DialogDescription>
                Kết quả xác thực chữ ký số phiếu {transaction.voucherNo}
              </DialogDescription>
            </DialogHeader>
            <div className="whitespace-pre-line text-sm p-4 bg-muted rounded-lg">
              {verifyResult.details}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sign confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Ký duyệt chứng từ
            </DialogTitle>
            <DialogDescription>
              Xác nhận ký duyệt phiếu {transaction.voucherNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              <div>
                <span className="text-muted-foreground">Số phiếu:</span>
                <p className="font-semibold">{transaction.voucherNo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ngày:</span>
                <p className="font-semibold">{new Date(transaction.date).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Số tiền:</span>
                <p className="font-semibold">{transaction.amount.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <span className="text-muted-foreground">Loại:</span>
                <p className="font-semibold">{voucherType === 'thu' ? 'Phiếu thu' : 'Phiếu chi'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Nội dung:</span>
                <p className="font-semibold">{transaction.description}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Hệ thống sẽ tạo mã băm SHA-256 từ dữ liệu chứng từ và ký bằng khóa RSA của bạn. Chữ ký sẽ được lưu vào cơ sở dữ liệu.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Hủy
              </Button>
              <Button onClick={handleSign} disabled={signing} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {signing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
                Xác nhận ký
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}