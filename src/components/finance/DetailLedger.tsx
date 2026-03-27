import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getTransactions, getOrgSettings, deleteTransaction } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { ClipboardList, Printer, Download, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrintDetailLedger } from './PrintDetailLedger';
import { EditTransactionDialog } from './EditTransactionDialog';
import { exportDetailLedgerExcel } from '@/lib/export-utils';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

const typeLabels: Record<string, { label: string; class: string }> = {
  thu: { label: 'PT', class: 'bg-green-100 text-green-700' },
  chi: { label: 'PC', class: 'bg-red-100 text-red-700' },
  'tham-hoi': { label: 'TH', class: 'bg-blue-100 text-blue-700' },
  'de-nghi': { label: 'DN', class: 'bg-amber-100 text-amber-700' },
};

interface DetailLedgerProps {
  refreshKey?: number;
  onSaved?: () => void;
}

export function DetailLedger({ refreshKey, onSaved }: DetailLedgerProps) {
  const settings = getOrgSettings();
  const [localRefresh, setLocalRefresh] = useState(0);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return getTransactions().sort((a, b) => a.date.localeCompare(b.date));
  }, [refreshKey, localRefresh]);

  const handleRefresh = () => {
    setLocalRefresh(k => k + 1);
    onSaved?.();
  };

  const handleDelete = () => {
    if (!deleteTxId) return;
    deleteTransaction(deleteTxId);
    toast.success('Đã xóa chứng từ');
    setDeleteTxId(null);
    handleRefresh();
  };

  return (
    <>
      <Card className="border-border shadow-lg no-print">
        <CardHeader className="bg-primary/5 border-b border-border text-center relative">
          <div className="absolute right-4 top-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={exportDetailLedgerExcel}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> In sổ
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <ClipboardList className="h-6 w-6" /> SỔ CHI TIẾT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                 <TableRow className="bg-muted/50">
                  <TableHead className="text-center w-28">Ngày CT</TableHead>
                  <TableHead className="text-center w-20">Số CT</TableHead>
                  <TableHead className="text-right w-28">Số tiền</TableHead>
                  <TableHead className="max-w-xs">Nội dung</TableHead>
                  <TableHead className="text-center w-16">Loại</TableHead>
                  <TableHead className="text-center w-20">TK Nợ</TableHead>
                  <TableHead className="text-center w-20">TK Có</TableHead>
                  <TableHead className="w-28">Họ tên</TableHead>
                  <TableHead className="w-40">Đơn vị</TableHead>
                  <TableHead className="text-center w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const t = typeLabels[row.type] || { label: row.type, class: 'bg-muted text-muted-foreground' };
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-sm">{formatDate(row.date)}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{row.voucherNo}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(row.amount)}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{row.description}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${t.class}`}>{t.label}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {row.type === 'thu' ? '111' : (row.accountCode || '')}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {row.type === 'chi' ? '111' : (row.accountCode || '')}
                      </TableCell>
                      <TableCell className="text-sm">{row.personName}</TableCell>
                      <TableCell className="text-sm truncate max-w-[10rem]">{row.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTx(row)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTxId(row.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditTransactionDialog
        transaction={editTx}
        open={!!editTx}
        onOpenChange={open => { if (!open) setEditTx(null); }}
        onSaved={handleRefresh}
      />

      <AlertDialog open={!!deleteTxId} onOpenChange={open => { if (!open) setDeleteTxId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc chắn muốn xóa chứng từ này? Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="print-only hidden">
        <PrintDetailLedger refreshKey={refreshKey} />
      </div>
    </>
  );
}
