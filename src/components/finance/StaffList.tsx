import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StaffMember, StaffSettings } from '@/types/finance';
import {
  getStaffList, addStaff, updateStaff, deleteStaff,
  getStaffSettings, saveStaffSettings,
  calculateInsuranceSalary, calculateUnionFee,
} from '@/lib/staff-store';
import { Users, Plus, Trash2, Pencil, Save, Settings2, Printer, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { PrintStaffList, PrintMonthlyFee } from './PrintStaffList';

const emptyStaff: Omit<StaffMember, 'id'> = {
  fullName: '', department: '', position: '', birthDate: '', gender: 'nam',
  salaryCoefficient: 0, positionCoefficient: 0,
};

export function StaffList() {
  const [list, setList] = useState<StaffMember[]>([]);
  const [settings, setSettings] = useState<StaffSettings>(getStaffSettings());
  const [form, setForm] = useState(emptyStaff);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'staff' | 'fee' | null>(null);
  const [feeMonth, setFeeMonth] = useState(new Date().getMonth() + 1);
  const [feeYear, setFeeYear] = useState(new Date().getFullYear());
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setList(getStaffList()); }, []);
  const reload = () => setList(getStaffList());

  const handleSaveSettings = () => {
    saveStaffSettings(settings);
    toast.success('Đã lưu thông số lương chung');
    setSettingsOpen(false);
  };

  const handleSubmit = () => {
    if (!form.fullName.trim()) { toast.error('Vui lòng nhập họ tên'); return; }
    if (editingId) {
      updateStaff(editingId, form);
      toast.success('Đã cập nhật cán bộ');
    } else {
      addStaff(form);
      toast.success('Đã thêm cán bộ');
    }
    setForm(emptyStaff);
    setEditingId(null);
    setDialogOpen(false);
    reload();
  };

  const handleEdit = (s: StaffMember) => {
    setForm({ fullName: s.fullName, department: s.department, position: s.position, birthDate: s.birthDate, gender: s.gender, salaryCoefficient: s.salaryCoefficient, positionCoefficient: s.positionCoefficient });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteStaff(id);
    toast.success('Đã xóa cán bộ');
    reload();
  };

  const openLandscapePrintWindow = (mode: 'staff' | 'fee') => {
    const printMarkup = printRef.current?.innerHTML;

    if (!printMarkup) {
      toast.error('Không lấy được nội dung để in');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1400,height=900');
    if (!printWindow) {
      toast.error('Trình duyệt đang chặn cửa sổ in');
      return;
    }

    const title = mode === 'fee' ? 'Danh sách thu đoàn phí' : 'Danh sách cán bộ';

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }

            body {
              font-family: 'Times New Roman', Times, serif;
            }

            .print-content {
              width: 100%;
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.4;
              color: #000;
            }

            .print-content table {
              width: 100%;
              border-collapse: collapse;
            }

            .print-content td,
            .print-content th {
              border: 1px solid #000;
            }
          </style>
        </head>
        <body>${printMarkup}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrint = (mode: 'staff' | 'fee') => {
    setPrintMode(mode);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        openLandscapePrintWindow(mode);
      });
    });
  };

  const totalUnionFee = useMemo(() => {
    return list.reduce((sum, s) => {
      const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, settings);
      return sum + calculateUnionFee(lbh, settings.baseSalary);
    }, 0);
  }, [list, settings]);

  const fmt = (n: number) => n.toLocaleString('vi-VN');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-6 w-6" /> Danh sách cán bộ
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint('staff')}>
            <Printer className="h-4 w-4 mr-1" /> In danh sách
          </Button>

          {/* Monthly fee print dialog */}
          <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4 mr-1" /> In thu đoàn phí
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader><DialogTitle>In danh sách thu đoàn phí</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tháng</Label>
                    <Select value={String(feeMonth)} onValueChange={v => setFeeMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Tháng {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Năm</Label>
                    <Input type="number" value={feeYear} onChange={e => setFeeYear(Number(e.target.value) || new Date().getFullYear())} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setFeeDialogOpen(false); handlePrint('fee'); }}>
                  <Printer className="h-4 w-4 mr-1" /> In
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Settings2 className="h-4 w-4 mr-1" /> Thông số lương</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Thông số lương chung</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                {([
                  ['minimumSalary', 'Lương tối thiểu (VNĐ)'],
                  ['regionalSalary', 'Lương vùng (VNĐ)'],
                  ['baseSalary', 'Lương cơ sở (VNĐ) - để tính trần đoàn phí'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input type="number" value={settings[key]} onChange={e => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))} />
                  </div>
                ))}
                <Button onClick={handleSaveSettings} className="w-full"><Save className="h-4 w-4 mr-1" /> Lưu</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add staff dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyStaff); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm cán bộ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingId ? 'Sửa thông tin cán bộ' : 'Thêm cán bộ mới'}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Họ và tên</Label>
                  <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Đơn vị công tác</Label>
                  <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Phòng Kế toán" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chức vụ</Label>
                  <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="Chuyên viên" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ngày sinh</Label>
                  <Input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Giới tính</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v as 'nam' | 'nu' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nam">Nam</SelectItem>
                      <SelectItem value="nu">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hệ số lương</Label>
                  <Input type="number" step="0.01" value={form.salaryCoefficient} onChange={e => setForm(p => ({ ...p, salaryCoefficient: Number(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hệ số chức vụ</Label>
                  <Input type="number" step="0.01" value={form.positionCoefficient} onChange={e => setForm(p => ({ ...p, positionCoefficient: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full"><Save className="h-4 w-4 mr-1" /> {editingId ? 'Cập nhật' : 'Thêm'}</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 no-print">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tổng cán bộ</p><p className="text-2xl font-bold text-primary">{list.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lương tối thiểu</p><p className="text-lg font-semibold text-foreground">{fmt(settings.minimumSalary)} ₫</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lương vùng</p><p className="text-lg font-semibold text-foreground">{fmt(settings.regionalSalary)} ₫</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tổng đoàn phí CĐ/tháng</p><p className="text-lg font-bold text-primary">{fmt(Math.round(totalUnionFee))} ₫</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card className="no-print">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 text-center">STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead className="text-center">Ngày sinh</TableHead>
                  <TableHead className="text-center">GT</TableHead>
                  <TableHead className="text-right">HS lương</TableHead>
                  <TableHead className="text-right">HS CV</TableHead>
                  <TableHead className="text-right">Lương BH</TableHead>
                  <TableHead className="text-right">Đoàn phí CĐ</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Chưa có cán bộ nào. Nhấn "Thêm cán bộ" để bắt đầu.</TableCell></TableRow>
                )}
                {list.map((s, i) => {
                  const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, settings);
                  const fee = calculateUnionFee(lbh, settings.baseSalary);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell className="text-sm">{s.department}</TableCell>
                      <TableCell className="text-sm">{s.position}</TableCell>
                      <TableCell className="text-center text-sm">{s.birthDate ? new Date(s.birthDate).toLocaleDateString('vi-VN') : ''}</TableCell>
                      <TableCell className="text-center text-sm">{s.gender === 'nam' ? 'Nam' : 'Nữ'}</TableCell>
                      <TableCell className="text-right font-mono">{s.salaryCoefficient.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{s.positionCoefficient.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Math.round(lbh))}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{fmt(Math.round(fee))}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formula note */}
      <Card className="bg-muted/30 no-print">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p><strong>Công thức tính:</strong></p>
          <p>• Lương BH = (Hệ số lương × Lương vùng) + (Hệ số chức vụ × Lương tối thiểu)</p>
          <p>• Đoàn phí CĐ = Lương BH × 0,5% (nhưng không quá 10% × Lương cơ sở)</p>
          <p>• Trần đoàn phí hiện tại: {fmt(Math.round(settings.baseSalary * 0.1))} ₫/tháng</p>
        </CardContent>
      </Card>

      {/* Print views */}
      <div ref={printRef} className="print-only print-landscape">
        {printMode === 'fee' ? (
          <PrintMonthlyFee month={feeMonth} year={feeYear} />
        ) : (
          <PrintStaffList />
        )}
      </div>
    </div>
  );
}
