import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { signData, createSignableData } from '@/lib/crypto-utils';
import { Transaction } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onApproved: () => void;
}

export function ApprovalDialog({ open, onOpenChange, transaction, onApproved }: ApprovalDialogProps) {
  const { user, isLeader, isAccountant, roles } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [comment, setComment] = useState('');
  const [signing, setSigning] = useState(false);

  const approverRole = isLeader ? 'leader' : isAccountant ? 'accountant' : roles[0] || 'user';

  const handleApprove = async () => {
    if (!user || !password) return;
    setSigning(true);

    try {
      // Verify password by re-authenticating
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password,
      });
      if (authError) throw new Error('Mật khẩu không đúng');

      // Get private key
      const { data: keyData } = await supabase
        .from('digital_keys')
        .select('private_key_encrypted')
        .eq('user_id', user.id)
        .single();

      if (!keyData) throw new Error('Bạn chưa được cấp chữ ký số. Liên hệ quản trị viên.');

      // Sign the transaction data
      const signableData = createSignableData(transaction);
      const signature = await signData(keyData.private_key_encrypted, signableData);

      // Save approval
      const { error } = await supabase.from('document_approvals').insert({
        transaction_id: transaction.id,
        approver_id: user.id,
        approver_role: approverRole as any,
        status: 'approved',
        signature,
        signed_data: signableData,
        comment,
        signed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: 'Đã duyệt', description: `Chứng từ ${transaction.voucherNo} đã được ký số và duyệt.` });
      setPassword('');
      setComment('');
      onOpenChange(false);
      onApproved();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setSigning(false);
  };

  const handleReject = async () => {
    if (!user) return;
    setSigning(true);
    try {
      const { error } = await supabase.from('document_approvals').insert({
        transaction_id: transaction.id,
        approver_id: user.id,
        approver_role: approverRole as any,
        status: 'rejected',
        comment,
        signed_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast({ title: 'Đã từ chối', description: `Chứng từ ${transaction.voucherNo} đã bị từ chối.` });
      setComment('');
      onOpenChange(false);
      onApproved();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setSigning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Duyệt chứng từ - {transaction.voucherNo}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
            <p><strong>Loại:</strong> {transaction.type === 'thu' ? 'Phiếu thu' : transaction.type === 'chi' ? 'Phiếu chi' : transaction.type === 'tham-hoi' ? 'Phiếu thăm hỏi' : 'Đề nghị thanh toán'}</p>
            <p><strong>Số tiền:</strong> {transaction.amount.toLocaleString('vi-VN')} đ</p>
            <p><strong>Nội dung:</strong> {transaction.description}</p>
            <p><strong>Ngày:</strong> {new Date(transaction.date).toLocaleDateString('vi-VN')}</p>
          </div>

          <div className="space-y-2">
            <Label>Nhập mật khẩu để ký số</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mật khẩu xác thực"
            />
          </div>

          <div className="space-y-2">
            <Label>Ghi chú (tùy chọn)</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhận xét, ghi chú..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={handleReject} disabled={signing}>
            <XCircle className="h-4 w-4 mr-1" /> Từ chối
          </Button>
          <Button onClick={handleApprove} disabled={signing || !password}>
            <CheckCircle className="h-4 w-4 mr-1" /> {signing ? 'Đang ký...' : 'Duyệt & Ký số'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
