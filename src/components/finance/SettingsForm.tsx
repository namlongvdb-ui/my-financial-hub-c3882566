import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getOrgSettings, saveOrgSettings } from '@/lib/finance-store';
import { OrgSettings } from '@/types/finance';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsFormProps {
  onSaved?: () => void;
}

const fields: { key: keyof OrgSettings; label: string; placeholder: string; type?: string }[] = [
  { key: 'orgName', label: 'Tên tổ chức (dòng 1)', placeholder: 'Công đoàn NHPT Việt Nam' },
  { key: 'orgSubName', label: 'Tên đơn vị (dòng 2)', placeholder: 'CĐ NHPT Chi nhánh KV Bắc Đông Bắc' },
  { key: 'leaderName', label: 'Lãnh đạo đơn vị', placeholder: 'Họ tên lãnh đạo' },
  { key: 'unionLeaderName', label: 'Tổ trưởng Công đoàn', placeholder: 'Họ tên tổ trưởng CĐ' },
  { key: 'chiefAccountantName', label: 'Kế toán trưởng', placeholder: 'Họ tên kế toán trưởng' },
  { key: 'accountantName', label: 'Phụ trách kế toán', placeholder: 'Họ tên kế toán' },
  { key: 'treasurerName', label: 'Thủ quỹ', placeholder: 'Họ tên thủ quỹ' },
  { key: 'creatorName', label: 'Người lập', placeholder: 'Họ tên người lập' },
  { key: 'defaultAccountCode', label: 'Số tài khoản mặc định', placeholder: '111' },
  { key: 'openingBalance', label: 'Số dư đầu kỳ (VNĐ)', placeholder: '50000000', type: 'number' },
];

export function SettingsForm({ onSaved }: SettingsFormProps) {
  const [form, setForm] = useState<OrgSettings>(getOrgSettings());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName.trim() || !form.orgSubName.trim()) {
      toast.error('Vui lòng điền tên tổ chức và đơn vị');
      return;
    }
    saveOrgSettings({
      ...form,
      openingBalance: Number(form.openingBalance) || 0,
    });
    toast.success('Đã lưu cài đặt thành công');
    onSaved?.();
  };

  const updateField = (key: keyof OrgSettings, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: key === 'openingBalance' ? Number(value) || 0 : value,
    }));
  };

  return (
    <Card className="max-w-3xl mx-auto border-border shadow-lg">
      <CardHeader className="bg-primary/5 border-b border-border">
        <div className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" /> CÀI ĐẶT THÔNG TIN
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Thông tin đơn vị và nhân sự hiển thị trên các sổ sách, phiếu thu chi</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <Label className="text-muted-foreground text-xs">{field.label}</Label>
              <Input
                type={field.type || 'text'}
                value={String(form[field.key])}
                onChange={e => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={field.type === 'number' ? 'text-lg font-semibold' : ''}
              />
            </div>
          ))}

          {form.openingBalance > 0 && (
            <div className="bg-muted/50 rounded-md p-3 border border-border">
              <p className="text-sm text-muted-foreground">Số dư đầu kỳ:</p>
              <p className="font-medium text-primary text-lg">{Number(form.openingBalance).toLocaleString('vi-VN')} ₫</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" /> Lưu cài đặt
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
