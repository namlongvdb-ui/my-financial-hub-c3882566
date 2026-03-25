import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, getNextVoucherNo, numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Heart, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PrintVisitVoucher } from './PrintVisitVoucher';

interface VisitVoucherFormProps {
  onSaved?: () => void;
}

export function VisitVoucherForm({ onSaved }: VisitVoucherFormProps) {
  const settings = getOrgSettings();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    voucherNo: getNextVoucherNo('tham-hoi'),
    visitorDepartment: 'Tổ CĐ Kế toán – Hành chính',
    recipientName: '',
    reason: '',
    amount: '',
  });

  const amount = parseInt(form.amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName || !form.reason || amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
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
    setForm({
      ...form,
      voucherNo: getNextVoucherNo('tham-hoi'),
      recipientName: '',
      reason: '',
      amount: '',
    });
    onSaved?.();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto border-border shadow-lg no-print">
        <CardHeader className="bg-primary/5 border-b border-border relative">
          <Button type="button" variant="outline" size="sm" className="absolute right-4 top-4" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> In phiếu
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground tracking-wider uppercase">{settings.orgName}</p>
            <p className="text-xs text-muted-foreground">{settings.orgSubName}</p>
            <CardTitle className="text-2xl font-bold text-primary mt-3 flex items-center justify-center gap-2">
              <Heart className="h-6 w-6" />
              PHIẾU THĂM HỎI
            </CardTitle>
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

            <Button type="submit" className="w-full" size="lg">
              <Save className="h-4 w-4 mr-2" /> Lưu Phiếu Thăm Hỏi
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
    </>
  );
}
