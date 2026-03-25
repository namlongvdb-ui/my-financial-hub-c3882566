import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';
import { FileText, Printer } from 'lucide-react';
import { PrintPaymentRequest } from './PrintPaymentRequest';

export function PaymentRequestForm() {
  const settings = getOrgSettings();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
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

  const amount = parseInt(form.amount) || 0;

  return (
    <>
      <Card className="max-w-3xl mx-auto border-border shadow-lg no-print">
        <CardHeader className="bg-primary/5 border-b border-border relative">
          <Button type="button" variant="outline" size="sm" className="absolute right-4 top-4" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> In giấy
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground tracking-wider uppercase">{settings.orgName}</p>
            <p className="text-xs text-muted-foreground">{settings.orgSubName}</p>
            <CardTitle className="text-2xl font-bold text-primary mt-3 flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              GIẤY ĐỀ NGHỊ THANH TOÁN
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Ngày</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Số</Label>
                <Input value={form.requestNo} onChange={e => setForm({ ...form, requestNo: e.target.value })} placeholder="Số..." />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Họ và tên người đề nghị thanh toán</Label>
              <Input value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} placeholder="Trần Nam Long" />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Bộ phận</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
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
          </div>
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
    </>
  );
}
