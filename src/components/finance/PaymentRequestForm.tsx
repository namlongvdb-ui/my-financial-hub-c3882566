import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, updateTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { FileText, Printer, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { PrintPaymentRequest } from './PrintPaymentRequest';
import { TransactionList } from './TransactionList';

interface PaymentRequestFormProps {
  onSaved?: () => void;
  refreshKey?: number;
}

const emptyForm = (settings: ReturnType<typeof getOrgSettings>) => ({
  date: new Date().toISOString().split('T')[0],
  voucherNo: getNextVoucherNo('de-nghi'),
  requestNo: '',
  requesterName: '',
  department: 'Tổ công đoàn bộ phận KT – HC, Phòng GD Cao Bằng.',
  content: '',
  amount: '',
  times: '1',
  bankAccount: '',
  bankAccountName: '',
  bankName: 'BIDV – Chi nhánh Cao Bằng',
  attachments: '',
});

export function PaymentRequestForm({ onSaved, refreshKey }: PaymentRequestFormProps) {
  const settings = getOrgSettings();
  const [form, setForm] = useState(() => emptyForm(settings));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const amount = parseInt(form.amount) || 0;

  const handleSelectForEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      date: tx.date,
      voucherNo: tx.voucherNo,
      requestNo: '',
      requesterName: tx.personName,
      department: tx.department,
      content: tx.description,
      amount: tx.amount.toString(),
      times: tx.times || '1',
      bankAccount: tx.bankAccount || '',
      bankAccountName: tx.bankAccountName || '',
      bankName: tx.bankName || 'BIDV – Chi nhánh Cao Bằng',
      attachments: tx.attachments?.toString() || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTx(null);
    setForm(emptyForm(settings));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requesterName || !form.content || amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (editingTx) {
      updateTransaction(editingTx.id, {
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'de-nghi',
        amount,
        description: form.content,
        personName: form.requesterName,
        department: form.department,
        attachments: parseInt(form.attachments) || 0,
        bankAccount: form.bankAccount,
        bankAccountName: form.bankAccountName,
        bankName: form.bankName,
        times: form.times,
      });
      toast.success(`Đề nghị thanh toán ${form.voucherNo} đã được cập nhật`);
      setEditingTx(null);
    } else {
      addTransaction({
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'de-nghi',
        amount,
        description: form.content,
        personName: form.requesterName,
        department: form.department,
        accountCode: '',
        approver: settings.unionGroups[0]?.leaderName || '',
        attachments: parseInt(form.attachments) || 0,
        bankAccount: form.bankAccount,
        bankAccountName: form.bankAccountName,
        bankName: form.bankName,
        times: form.times,
      });
      toast.success(`Đề nghị thanh toán ${form.voucherNo} đã được lưu`);
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
              <Printer className="h-4 w-4 mr-1" /> In giấy
            </Button>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              {editingTx ? 'SỬA GIẤY ĐỀ NGHỊ THANH TOÁN' : 'GIẤY ĐỀ NGHỊ THANH TOÁN'}
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
              <Label className="text-muted-foreground text-xs">Họ và tên người đề nghị thanh toán</Label>
              <Input value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} placeholder="Trần Nam Long" />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Đơn vị</Label>
              <Select value={form.department} onValueChange={val => setForm({ ...form, department: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị..." />
                </SelectTrigger>
                <SelectContent>
                  {settings.unionGroups.map(g => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Nội dung thanh toán</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Nội dung chi tiết..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Số tiền (VNĐ)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="text-lg font-semibold" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Lần thứ</Label>
                <Input value={form.times} onChange={e => setForm({ ...form, times: e.target.value })} />
              </div>
            </div>

            {amount > 0 && (
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <p className="text-sm text-muted-foreground">Viết bằng chữ:</p>
                <p className="font-medium text-foreground italic">{numberToVietnameseWords(amount)}</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Thông tin chuyển khoản</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Số TK</Label>
                  <Input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} placeholder="3300025372" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tên TK</Label>
                  <Input value={form.bankAccountName} onChange={e => setForm({ ...form, bankAccountName: e.target.value })} placeholder="Trần Nam Long" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tại NH</Label>
                  <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Kèm theo chứng từ gốc</Label>
              <Input value={form.attachments} onChange={e => setForm({ ...form, attachments: e.target.value })} placeholder="Số chứng từ gốc..." />
            </div>

            <Button type="submit" className={`w-full ${editingTx ? 'bg-amber-600 hover:bg-amber-700' : ''}`} size="lg">
              <Save className="h-4 w-4 mr-2" /> {editingTx ? 'Cập nhật Đề Nghị Thanh Toán' : 'Lưu Đề Nghị Thanh Toán'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="print-only hidden">
        <PrintPaymentRequest data={{
          date: form.date,
          requestNo: form.requestNo,
          requesterName: form.requesterName,
          department: form.department,
          content: form.content,
          amount,
          times: form.times,
          bankAccount: form.bankAccount,
          bankAccountName: form.bankAccountName,
          bankName: form.bankName,
          attachments: form.attachments,
        }} />
      </div>

      <TransactionList
        type="de-nghi"
        title="GIẤY ĐỀ NGHỊ THANH TOÁN"
        personLabel="Người đề nghị"
        onChanged={onSaved}
        refreshKey={refreshKey}
        onSelectForEdit={handleSelectForEdit}
      />
    </>
  );
}
