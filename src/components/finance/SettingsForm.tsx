import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getOrgSettings, saveOrgSettings } from '@/lib/finance-store';
import { OrgSettings } from '@/types/finance';
import { ACCOUNT_CHART, searchAccounts, ACCOUNT_CATEGORIES } from '@/lib/account-chart';
import { Settings, Save, Plus, Trash2, Search, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsFormProps {
  onSaved?: () => void;
}

const fields: { key: keyof OrgSettings; label: string; placeholder: string; type?: string }[] = [
  { key: 'orgName', label: 'Tên tổ chức (dòng 1)', placeholder: 'Công đoàn NHPT Việt Nam' },
  { key: 'orgSubName', label: 'Tên đơn vị (dòng 2)', placeholder: 'Công đoàn NHPT Chi nhánh KV Bắc Đông Bắc' },
  { key: 'leaderName', label: 'Lãnh đạo đơn vị', placeholder: 'Họ tên lãnh đạo' },
  { key: 'accountantName', label: 'Phụ trách kế toán', placeholder: 'Họ tên kế toán' },
  { key: 'treasurerName', label: 'Thủ quỹ', placeholder: 'Họ tên thủ quỹ' },
  { key: 'creatorName', label: 'Người lập', placeholder: 'Họ tên người lập' },
  { key: 'openingBalance', label: 'Số dư đầu kỳ (VNĐ)', placeholder: '50000000', type: 'number' },
];

function AccountCodePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => searchAccounts(search), [search]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const acc of filtered) {
      if (!map[acc.category]) map[acc.category] = [];
      map[acc.category].push(acc);
    }
    return map;
  }, [filtered]);

  const selectedAccount = ACCOUNT_CHART.find(a => a.code === value);

  return (
    <div className="space-y-2">
      {/* Selected value display */}
      {value && (
        <div className="flex items-center gap-2 bg-primary/5 rounded-md px-3 py-2 border border-primary/20">
          <Badge variant="secondary" className="font-mono text-xs">{value}</Badge>
          <span className="text-sm text-foreground flex-1">{selectedAccount?.name || value}</span>
          <button type="button" onClick={() => onChange('')} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-card border border-border shadow-sm hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Hệ thống tài khoản (TT 99/2025/TT-BTC)
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5">{ACCOUNT_CHART.length} TK</Badge>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-md">
          {/* Search */}
          <div className="relative p-3 border-b border-border bg-muted/20">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo số TK hoặc tên tài khoản..."
              className="pl-9 pr-9 h-9 text-sm"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {filtered.length} tài khoản {search && `phù hợp với "${search}"`}
            </p>
          </div>

          {/* Account list */}
          <ScrollArea className="h-[350px]">
            <div className="p-2">
              {Object.entries(grouped).map(([category, accounts]) => (
                <div key={category} className="mb-3">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/70 bg-primary/5 rounded mb-1">
                    {category}
                  </div>
                  {accounts.map(acc => {
                    const isSelected = value === acc.code;
                    return (
                      <button
                        key={acc.code}
                        type="button"
                        onClick={() => {
                          onChange(acc.code);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/60 text-foreground'
                        } ${acc.level === 2 ? 'pl-8' : acc.level === 3 ? 'pl-12' : ''}`}
                      >
                        <span className={`font-mono text-xs w-12 text-right shrink-0 ${
                          acc.level === 1 ? 'font-bold' : 'text-muted-foreground'
                        }`}>
                          {acc.code}
                        </span>
                        <span className={`text-left flex-1 ${acc.level === 1 ? 'font-semibold' : ''}`}>
                          {acc.name}
                        </span>
                        {isSelected && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">Đang chọn</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Không tìm thấy tài khoản phù hợp
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

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

  const addUnionGroup = () => {
    setForm(prev => ({
      ...prev,
      unionGroups: [...prev.unionGroups, { name: '', leaderName: '' }],
    }));
  };

  const removeUnionGroup = (index: number) => {
    setForm(prev => ({
      ...prev,
      unionGroups: prev.unionGroups.filter((_, i) => i !== index),
    }));
  };

  const updateUnionGroup = (index: number, field: 'name' | 'leaderName', value: string) => {
    setForm(prev => ({
      ...prev,
      unionGroups: prev.unionGroups.map((g, i) => i === index ? { ...g, [field]: value } : g),
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

          {/* Account Code Picker - TT 99/2025 */}
          <div className="border-t border-border pt-4">
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Tài khoản kế toán mặc định
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Chọn tài khoản đối ứng mặc định khi lập phiếu thu/chi. Theo Thông tư 99/2025/TT-BTC (có hiệu lực từ 01/01/2026).
            </p>
            <AccountCodePicker
              value={form.defaultAccountCode}
              onChange={(code) => setForm(prev => ({ ...prev, defaultAccountCode: code }))}
            />
          </div>

          {/* Dynamic Union Groups */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-foreground">Danh sách Tổ Công đoàn</Label>
              <Button type="button" variant="outline" size="sm" onClick={addUnionGroup}>
                <Plus className="h-4 w-4 mr-1" /> Thêm tổ CĐ
              </Button>
            </div>
            <div className="space-y-3">
              {form.unionGroups.map((group, index) => (
                <div key={index} className="flex gap-2 items-end bg-muted/30 rounded-md p-3 border border-border">
                  <div className="flex-1">
                    <Label className="text-muted-foreground text-xs">Tên tổ công đoàn</Label>
                    <Input
                      value={group.name}
                      onChange={e => updateUnionGroup(index, 'name', e.target.value)}
                      placeholder="VD: Tổ CĐ BP Kế toán – Hành chính"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-muted-foreground text-xs">Tổ trưởng</Label>
                    <Input
                      value={group.leaderName}
                      onChange={e => updateUnionGroup(index, 'leaderName', e.target.value)}
                      placeholder="Họ tên tổ trưởng"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => removeUnionGroup(index)}
                    disabled={form.unionGroups.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" /> Lưu cài đặt
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
