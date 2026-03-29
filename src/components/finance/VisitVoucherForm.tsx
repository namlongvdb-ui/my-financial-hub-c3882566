import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTransaction, updateTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { Heart, Printer, Save, X, DollarSign, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PrintVisitVoucher } from './PrintVisitVoucher';
import { TransactionList } from './TransactionList';
import { useAuth } from '@/hooks/useAuth';
import { submitVoucherForSigning, notifySigners, getVoucherLabel } from '@/lib/notification-utils';

interface VisitVoucherFormProps {
  onSaved?: () => void;
  refreshKey?: number;
}

const emptyForm = (settings: ReturnType<typeof getOrgSettings>) => ({
  date: new Date().toISOString().split('T')[0],
  voucherNo: getNextVoucherNo('tham-hoi'),
  visitorDepartment: settings.unionGroups[0]?.name || '',
  recipientName: '',
  reason: '',
  amount: '',
  unionGroupName: settings.unionGroups[0]?.name || '',
});

export function VisitVoucherForm({ onSaved, refreshKey }: VisitVoucherFormProps) {
  const { user, profile } = useAuth();
  const settings = getOrgSettings();
  const [form, setForm] = useState(() => emptyForm(settings));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const amount = parseInt(form.amount) || 0;

  const handleSelectForEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      date: tx.date,
      voucherNo: tx.voucherNo,
      visitorDepartment: tx.department,
      recipientName: tx.recipientName || tx.personName,
      reason: tx.reason || tx.description,
      amount: tx.amount.toString(),
      unionGroupName: tx.department || settings.unionGroups[0]?.name || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTx(null);
    setForm(emptyForm(settings));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName || !form.reason || amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (editingTx) {
      updateTransaction(editingTx.id, {
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'tham-hoi',
        amount,
        description: form.reason,
        personName: form.recipientName,
        department: form.unionGroupName,
        recipientName: form.recipientName,
        reason: form.reason,
      });
      toast.success(`Phiếu thăm hỏi ${form.voucherNo} đã được cập nhật`);
      setEditingTx(null);
    } else {
      const txData = {
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'tham-hoi' as const,
        amount,
        description: form.reason,
        personName: form.recipientName,
        department: form.unionGroupName,
        accountCode: '',
        approver: settings.unionGroups[0]?.leaderName || '',
        attachments: 0,
        recipientName: form.recipientName,
        reason: form.reason,
      };
      addTransaction(txData);
      
      if (user) {
        submitVoucherForSigning(form.voucherNo, 'tham-hoi', txData, user.id);
        notifySigners(form.voucherNo, 'tham-hoi', getVoucherLabel('tham-hoi'), profile?.full_name || 'Kế toán');
      }
      
      toast.success(`Phiếu thăm hỏi ${form.voucherNo} đã được lưu`);
    }

    setForm(emptyForm(settings));
    onSaved?.();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-lg no-print overflow-hidden border-0 ring-1 ring-border">
        {/* Header */}
        <CardHeader className={`relative py-5 ${editingTx ? 'bg-amber-50 dark:bg-amber-950/30 border-b-2 border-amber-300 dark:border-amber-700' : 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-b-2 border-rose-200 dark:border-rose-800'}`}>
          <div className="flex items-center gap-2 absolute right-4 top-4">
            {editingTx && (
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} className="bg-background/80 backdrop-blur-sm">
                <X className="h-4 w-4 mr-1" /> Hủy sửa
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="bg-background/80 backdrop-blur-sm">
              <Printer className="h-4 w-4 mr-1" /> In phiếu
            </Button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-2 bg-rose-100 dark:bg-rose-900/50">
              <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              {editingTx ? 'Sửa phiếu thăm hỏi' : 'PHIẾU THĂM HỎI'}
            </CardTitle>
            {editingTx && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Đang sửa phiếu {editingTx.voucherNo}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Date & Voucher No */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium">Ngày</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium">Số CT</Label>
                <Input value={form.voucherNo} onChange={e => setForm({ ...form, voucherNo: e.target.value })} className="h-10 font-mono" />
              </div>
            </div>

            {/* Union group */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Tổ công đoàn
              </Label>
              <Select value={form.unionGroupName} onValueChange={val => setForm({ ...form, unionGroupName: val, visitorDepartment: val })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn tổ công đoàn..." />
                </SelectTrigger>
                <SelectContent>
                  {settings.unionGroups.map(g => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient name */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Họ và tên người được thăm hỏi
              </Label>
              <Input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} placeholder="Nhập họ tên..." className="h-10" />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium">Lý do thăm hỏi</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Lý do thăm hỏi..." rows={2} className="resize-none" />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Số tiền (VNĐ)
              </Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="h-12 text-xl font-bold tracking-wide" />
            </div>

            {amount > 0 && (
              <div className="rounded-lg p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                <p className="text-xs text-muted-foreground mb-0.5">Bằng chữ:</p>
                <p className="font-medium text-foreground italic text-sm">{numberToVietnameseWords(amount)}</p>
              </div>
            )}

            <Button type="submit" className={`w-full h-11 text-base font-semibold ${editingTx ? 'bg-amber-600 hover:bg-amber-700' : ''}`} size="lg">
              <Save className="h-4 w-4 mr-2" /> {editingTx ? 'Cập nhật Phiếu Thăm Hỏi' : 'Lưu Phiếu Thăm Hỏi'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="print-only hidden">
        <PrintVisitVoucher data={{
          date: form.date,
          visitorDepartment: form.visitorDepartment,
          recipientName: form.recipientName,
          reason: form.reason,
          amount,
          unionGroupName: form.unionGroupName,
        }} />
      </div>

      <TransactionList
        type="tham-hoi"
        title="PHIẾU THĂM HỎI"
        personLabel="Người được thăm hỏi"
        onChanged={onSaved}
        refreshKey={refreshKey}
        onSelectForEdit={handleSelectForEdit}
      />
    </>
  );
}
