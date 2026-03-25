import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getTransactions, deleteTransaction } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { Search, Trash2, List } from 'lucide-react';
import { toast } from 'sonner';

interface VoucherListProps {
  type: 'thu' | 'chi';
  onChanged?: () => void;
  refreshKey?: number;
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

export function VoucherList({ type, onChanged, refreshKey }: VoucherListProps) {
  const title = type === 'thu' ? 'PHIẾU THU' : 'PHIẾU CHI';
  const [search, setSearch] = useState('');

  const transactions = useMemo(() => {
    return getTransactions().filter(t => t.type === type);
  }, [type, refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(t =>
      t.voucherNo.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.personName.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  }, [transactions, search]);

  const handleDelete = (tx: Transaction) => {
    deleteTransaction(tx.id);
    toast.success(`Đã xóa ${tx.voucherNo}`);
    onChanged?.();
  };

  return (
    <Card className="max-w-5xl mx-auto border-border shadow-lg mt-6">
      <CardHeader className="bg-primary/5 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <List className="h-5 w-5" /> DANH SÁCH {title} ({filtered.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo số CT, nội dung, họ tên..."
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? 'Không tìm thấy kết quả phù hợp' : `Chưa có ${title.toLowerCase()} nào`}
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Số CT</TableHead>
                  <TableHead className="w-[100px]">Ngày</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Người {type === 'thu' ? 'nộp' : 'nhận'}</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.voucherNo}</TableCell>
                    <TableCell>{new Date(tx.date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{tx.description}</TableCell>
                    <TableCell>{tx.personName}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(tx.amount)} ₫</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa {tx.voucherNo}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa phiếu <strong>{tx.voucherNo}</strong> — "{tx.description}"? Thao tác này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tx)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
