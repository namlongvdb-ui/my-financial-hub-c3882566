import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { Heart, Printer } from 'lucide-react';
import { PrintVisitVoucher } from './PrintVisitVoucher';

export function VisitVoucherForm() {
  const settings = getOrgSettings();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    visitorName: '',
    visitorDepartment: 'Tổ CĐ Kế toán – Hành chính',
    recipientName: '',
    reason: '',
    amount: '',
  });

  const amount = parseInt(form.amount) || 0;

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
          <div className="space-y-5">
            <div>
              <Label className="text-muted-foreground text-xs">Ngày</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
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
          </div>
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
