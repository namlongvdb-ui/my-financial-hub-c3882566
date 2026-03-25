import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getTransactions, deleteTransaction } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { Search, Trash2, List, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionListProps {
  type: 'thu' | 'chi' | 'tham-hoi' | 'de-nghi';
  title: string;
  personLabel?: string;
  onChanged?: () => void;
  refreshKey?: number;
  onSelectForEdit?: (tx: Transaction) => void;
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

export function TransactionList({ type, title, personLabel, onChanged, refreshKey, onSelectForEdit }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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

  const handleEdit = (tx: Transaction) => {
    onSelectForEdit?.(tx);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="max-w-5xl mx-auto mt-6">
      <Card className="border-border shadow-lg">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                <List className="h-5 w-5" /> DANH SÁCH {title} ({transactions.length})
              </CardTitle>
              {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="p-3 border-b border-border">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo số CT, nội dung, họ tên..."
                  className="pl-9"
                />
              </div>
            </div>
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
                      <TableHead>{personLabel || 'Họ tên'}</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="w-[90px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(tx => (
                      <TableRow
                        key={tx.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleEdit(tx)}
                      >
                        <TableCell className="font-medium">{tx.voucherNo}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{tx.description}</TableCell>
                        <TableCell>{tx.personName}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(tx.amount)} ₫</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(tx); }} className="text-primary hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
