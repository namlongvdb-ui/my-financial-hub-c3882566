import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, updateTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { Heart, Printer, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { PrintVisitVoucher } from './PrintVisitVoucher';
import { TransactionList } from './TransactionList';

interface VisitVoucherFormProps {
  onSaved?: () => void;
  refreshKey?: number;
}

const emptyForm = (settings: ReturnType<typeof getOrgSettings>) => ({
  date: new Date().toISOString().split('T')[0],
  voucherNo: getNextVoucherNo('tham-hoi'),
  visitorDepartment: 'Tổ CĐ Kế toán – Hành chính',
  recipientName: '',
  reason: '',
  amount: '',
});

export function VisitVoucherForm({ onSaved, refreshKey }: VisitVoucherFormProps) {
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
        department: form.visitorDepartment,
        recipientName: form.recipientName,
        reason: form.reason,
      });
      toast.success(`Phiếu thăm hỏi ${form.voucherNo} đã được cập nhật`);
      setEditingTx(null);
    } else {
      addTransaction({
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'tham-hoi',
        amount,
        description: form.reason,
        personName: form.recipientName,
        department: form.visitorDepartment,
        accountCode: '',
        approver: settings.unionGroups[0]?.leaderName || '',
        attachments: 0,
        recipientName: form.recipientName,
        reason: form.reason,
      });
      toast.success(`Phiếu thăm hỏi ${form.voucherNo} đã được lưu`);
    }

    setForm(emptyForm(settings));
    onSaved?.();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto border-border shadow-lg no-print">
        <CardHeader className={`border-b border-border relative ${editingTx ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-primary/5'}`}>
          <div className="flex items-center gap-2 absolute right-4 top-4">
            {editingTx && (
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" /> Hủy sửa
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> In phiếu
            </Button>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <Heart className="h-6 w-6" />
              {editingTx ? 'SỬA PHIẾU THĂM HỎI' : 'PHIẾU THĂM HỎI'}
            </CardTitle>
            {editingTx && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                Đang sửa phiếu {editingTx.voucherNo}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Ngày</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Số CT</Label>
                <Input value={form.voucherNo} onChange={e => setForm({ ...form, voucherNo: e.target.value })} />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Họ và tên người thăm hỏi (đơn vị)</Label>
              <Input value={form.visitorDepartment} onChange={e => setForm({ ...form, visitorDepartment: e.target.value })} placeholder="Tổ CĐ Kế toán – Hành chính" />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Họ và tên người được thăm hỏi</Label>
              <Input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} placeholder="Con trai đ/c Trần Nam Long" />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Lý do thăm hỏi</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Lý do thăm hỏi..." rows={3} />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Số tiền (VNĐ)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="text-lg font-semibold" />
            </div>

            {amount > 0 && (
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <p className="text-sm text-muted-foreground">Bằng chữ:</p>
                <p className="font-medium text-foreground italic">{numberToVietnameseWords(amount)}</p>
              </div>
            )}

            <Button type="submit" className={`w-full ${editingTx ? 'bg-amber-600 hover:bg-amber-700' : ''}`} size="lg">
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
