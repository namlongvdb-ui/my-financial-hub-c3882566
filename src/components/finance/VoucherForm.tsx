import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { FileText, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface VoucherFormProps {
  type: 'thu' | 'chi';
  onSaved?: () => void;
}

export function VoucherForm({ type, onSaved }: VoucherFormProps) {
  const title = type === 'thu' ? 'PHIẾU THU' : 'PHIẾU CHI';
  const settings = getOrgSettings();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    voucherNo: getNextVoucherNo(type),
    amount: '',
    description: '',
    personName: '',
    department: '',
    accountCode: settings.defaultAccountCode,
    approver: settings.leaderName,
    attachments: 1,
  });

  const amount = parseInt(form.amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.description || amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    addTransaction({
      date: form.date,
      voucherNo: form.voucherNo,
      type,
      amount,
      description: form.description,
      personName: form.personName,
      department: form.department,
      accountCode: form.accountCode,
      approver: form.approver,
      attachments: form.attachments,
    });
    toast.success(`${title} ${form.voucherNo} đã được lưu`);
    setForm({
      ...form,
      voucherNo: getNextVoucherNo(type),
      amount: '',
      description: '',
      personName: '',
      department: '',
      accountCode: '',
    });
    onSaved?.();
  };

  return (
    <Card className="max-w-3xl mx-auto border-border shadow-lg print-container">
      <CardHeader className="bg-primary/5 border-b border-border relative">
        <Button type="button" variant="outline" size="sm" className="absolute right-4 top-4 no-print" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> In phiếu
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground tracking-wider uppercase">{settings.orgName}</p>
          <p className="text-xs text-muted-foreground">{settings.orgSubName}</p>
          <CardTitle className="text-2xl font-bold text-primary mt-3 flex items-center justify-center gap-2">
            <FileText className="h-6 w-6" />
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Ngày</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Số CT</Label>
              <Input value={form.voucherNo} onChange={e => setForm({ ...form, voucherNo: e.target.value })} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Mã TK</Label>
              <Input value={form.accountCode} onChange={e => setForm({ ...form, accountCode: e.target.value })} placeholder={settings.defaultAccountCode} />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">
              Họ và tên người {type === 'thu' ? 'nộp' : 'nhận'} tiền
            </Label>
            <Input value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} placeholder="Nhập họ tên..." />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Đơn vị</Label>
            <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Tổ CĐ BP..." />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Nội dung</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nội dung chi tiết..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Số tiền (VNĐ)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="text-lg font-semibold" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Người duyệt</Label>
              <Input value={form.approver} onChange={e => setForm({ ...form, approver: e.target.value })} />
            </div>
          </div>

          {amount > 0 && (
            <div className="bg-muted/50 rounded-md p-3 border border-border">
              <p className="text-sm text-muted-foreground">Viết bằng chữ:</p>
              <p className="font-medium text-foreground italic">{numberToVietnameseWords(amount)}</p>
            </div>
          )}

          <div className="border-t border-border pt-4 grid grid-cols-3 text-center text-xs text-muted-foreground">
            <div>
              <p className="font-semibold uppercase mb-1">Lãnh đạo đơn vị</p>
              <p>{form.approver}</p>
            </div>
            <div>
              <p className="font-semibold uppercase mb-1">Phụ trách kế toán</p>
              <p>{settings.accountantName}</p>
            </div>
            <div>
              <p className="font-semibold uppercase mb-1">Người lập</p>
              <p>{settings.creatorName}</p>
            </div>
          </div>

          <Button type="submit" className="w-full no-print" size="lg">
            <Save className="h-4 w-4 mr-2" /> Lưu {title}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
