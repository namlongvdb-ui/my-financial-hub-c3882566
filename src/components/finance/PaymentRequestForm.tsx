import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, updateTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { FileText, Printer, Save, X, DollarSign, User, Building2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PrintPaymentRequest } from './PrintPaymentRequest';
import { TransactionList } from './TransactionList';
import { useAuth } from '@/hooks/useAuth';
import { submitVoucherForSigning, notifySigners, getVoucherLabel } from '@/lib/notification-utils';

interface PaymentRequestFormProps {
  onSaved?: () => void;
  refreshKey?: number;
}

const emptyForm = (settings: ReturnType<typeof getOrgSettings>) => ({
  date: new Date().toISOString().split('T')[0],
  voucherNo: getNextVoucherNo('de-nghi'),
  requestNo: '',
  requesterName: '',
  department: settings.unionGroups[0]?.name || '',
  content: '',
  amount: '',
  times: '',
  bankAccount: '',
  bankAccountName: '',
  bankName: '',
  attachments: '',
});

export function PaymentRequestForm({ onSaved, refreshKey }: PaymentRequestFormProps) {
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
      requestNo: '',
      requesterName: tx.personName,
      department: tx.department,
      content: tx.description,
      amount: tx.amount.toString(),
      times: tx.times || '',
      bankAccount: tx.bankAccount || '',
      bankAccountName: tx.bankAccountName || '',
      bankName: tx.bankName || '',
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
      const txData = {
        date: form.date,
        voucherNo: form.voucherNo,
        type: 'de-nghi' as const,
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
        createdBy: user?.id,
      };
      addTransaction(txData);
      
      if (user) {
        submitVoucherForSigning(form.voucherNo, 'de-nghi', txData, user.id);
        notifySigners(form.voucherNo, 'de-nghi', getVoucherLabel('de-nghi'), profile?.full_name || 'Kế toán');
      }
      
      toast.success(`Đề nghị thanh toán ${form.voucherNo} đã được lưu`);
    }

    setForm(emptyForm(settings));
    onSaved?.();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-lg no-print overflow-hidden border-0 ring-1 ring-border">
        {/* Header */}
        <CardHeader className={`relative py-5 ${editingTx ? 'bg-amber-50 dark:bg-amber-950/30 border-b-2 border-amber-300 dark:border-amber-700' : 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b-2 border-violet-200 dark:border-violet-800'}`}>
          <div className="flex items-center gap-2 absolute right-4 top-4">
            {editingTx && (
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} className="bg-background/80 backdrop-blur-sm">
                <X className="h-4 w-4 mr-1" /> Hủy sửa
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="bg-background/80 backdrop-blur-sm">
              <Printer className="h-4 w-4 mr-1" /> In giấy
            </Button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-2 bg-violet-100 dark:bg-violet-900/50">
              <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              {editingTx ? 'Sửa giấy đề nghị thanh toán' : 'GIẤY ĐỀ NGHỊ THANH TOÁN'}
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

            {/* Requester name */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Họ và tên người đề nghị thanh toán
              </Label>
              <Input value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} placeholder="Nhập họ tên..." className="h-10" />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Đơn vị
              </Label>
              <Select value={form.department} onValueChange={val => setForm({ ...form, department: val })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn đơn vị..." />
                </SelectTrigger>
                <SelectContent>
                  {settings.unionGroups.map(g => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium">Nội dung thanh toán</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Nội dung chi tiết..." rows={2} className="resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end"> {/* items-end giúp chân 2 ô nhập luôn thẳng hàng */}
  {/* Cột 1: Số tiền */}
  <div className="flex flex-col space-y-1.5"> 
    <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5 h-4">
      <DollarSign className="h-3.5 w-3.5" />
      Số tiền (VNĐ)
    </Label>
    <Input 
      type="number" 
      value={form.amount} 
      onChange={e => setForm({ ...form, amount: e.target.value })} 
      placeholder="0" 
      className="h-12 text-lg font-bold tracking-wide" // Hạ text-xl xuống text-lg để bớt "phồng" ô
    />
  </div>

  {/* Cột 2: Lần thứ */}
  <div className="flex flex-col space-y-1.5">
    <Label className="text-muted-foreground text-xs font-medium h-4 flex items-center">
      Lần thứ
    </Label>
    <Input 
      value={form.times} 
      onChange={e => setForm({ ...form, times: e.target.value })} 
      placeholder="" 
      className="h-12 text-center font-mono" 
    />
  </div>
</div>

            {amount > 0 && (
              <div className="rounded-lg p-3.5 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                <p className="text-xs text-muted-foreground mb-0.5">Viết bằng chữ:</p>
                <p className="font-medium text-foreground italic text-sm">{numberToVietnameseWords(amount)}</p>
              </div>
            )}

            {/* Bank info section */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Thông tin chuyển khoản</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-medium">Số TK</Label>
                  <Input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} placeholder="Nhập số TK..." className="h-10 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-medium">Tên TK</Label>
                  <Input value={form.bankAccountName} onChange={e => setForm({ ...form, bankAccountName: e.target.value })} placeholder="Tên chủ TK..." className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-medium">Tại NH</Label>
                  <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="Tên ngân hàng..." className="h-10" />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium">Kèm theo chứng từ gốc</Label>
              <Input value={form.attachments} onChange={e => setForm({ ...form, attachments: e.target.value })} placeholder="Số chứng từ gốc..." className="h-10" />
            </div>

            <Button type="submit" className={`w-full h-11 text-base font-semibold ${editingTx ? 'bg-amber-600 hover:bg-amber-700' : ''}`} size="lg">
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
