import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getTransactions, deleteTransaction } from '@/lib/finance-store';
import { Transaction } from '@/types/finance';
import { Search, Trash2, Pencil, FileText, X, ChevronDown, ChevronUp, List, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { VoucherSignatureStatus, SignVoucherButton } from './VoucherSignature';
import { supabase } from '@/integrations/supabase/client';

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TransactionList({ type, title, personLabel, onChanged, refreshKey, onSelectForEdit }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sigRefreshKey, setSigRefreshKey] = useState(0);
  const [approvedVoucherIds, setApprovedVoucherIds] = useState<Set<string>>(new Set());

  const isVoucher = type === 'thu' || type === 'chi';

  // Fetch approved/signed voucher IDs to prevent editing
  const fetchApprovedIds = useCallback(async () => {
    const { data } = await supabase
      .from('pending_vouchers')
      .select('voucher_id')
      .eq('voucher_type', type)
      .in('status', ['signed', 'printed']);
    
    if (data) {
      setApprovedVoucherIds(new Set(data.map(v => v.voucher_id)));
    }
  }, [type]);

  useEffect(() => {
    fetchApprovedIds();
  }, [fetchApprovedIds, refreshKey, sigRefreshKey]);

  const isApproved = (voucherNo: string) => approvedVoucherIds.has(voucherNo);

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

  const totalAmount = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);

  const handleDelete = (tx: Transaction) => {
    if (isApproved(tx.voucherNo)) {
      toast.error('Chứng từ đã được duyệt, không thể xóa');
      return;
    }
    deleteTransaction(tx.id);
    toast.success(`Đã xóa ${tx.voucherNo}`);
    onChanged?.();
  };

  const handleEdit = (tx: Transaction) => {
    if (isApproved(tx.voucherNo)) {
      toast.error('Chứng từ đã được duyệt, không thể sửa');
      return;
    }
    onSelectForEdit?.(tx);
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 no-print">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 rounded-lg bg-card border border-border shadow-sm hover:bg-muted/40 transition-colors mb-0 group"
      >
        <div className="flex items-center gap-2.5">
          <List className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Danh sách {title.toLowerCase()}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0 font-medium">{transactions.length}</Badge>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isOpen && (
      <Card className="border-border shadow-sm overflow-hidden rounded-t-none border-t-0">
        {/* Header */}
        <CardHeader className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                <FileText className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                  {title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {transactions.length} chứng từ
                  {filtered.length !== transactions.length && ` · ${filtered.length} kết quả`}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm số CT, nội dung, họ tên..."
                className="pl-9 pr-9 h-9 text-sm bg-muted/40 border-border focus:bg-card transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {search ? 'Không tìm thấy kết quả' : `Chưa có ${title.toLowerCase()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo chứng từ mới ở form bên trên'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[90px] text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-6">Số CT</TableHead>
                      <TableHead className="w-[95px] text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nội dung</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{personLabel || 'Họ tên'}</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider pr-4">Số tiền</TableHead>
                      {isVoucher && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chữ ký</TableHead>}
                      {isVoucher && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ký duyệt</TableHead>}
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tx, idx) => {
                      const locked = isApproved(tx.voucherNo);
                      return (
                      <TableRow
                        key={tx.id}
                        className={`group transition-colors border-b border-border/50 last:border-b-0 ${locked ? 'cursor-default bg-muted/10' : 'cursor-pointer hover:bg-primary/[0.03]'}`}
                        onClick={() => !locked && handleEdit(tx)}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-1.5">
                            {locked && <Lock className="h-3 w-3 text-green-600 flex-shrink-0" />}
                            <Badge variant="secondary" className="font-mono text-xs font-medium px-2 py-0.5 bg-primary/8 text-primary border-0">
                              {tx.voucherNo}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="text-sm text-foreground truncate leading-tight">{tx.description}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground/80">{tx.personName}</span>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(tx.amount)} ₫
                          </span>
                        </TableCell>
                        {isVoucher && (
                          <TableCell onClick={e => e.stopPropagation()}>
                            <VoucherSignatureStatus transaction={tx} voucherType={type as 'thu' | 'chi'} key={`sig-${tx.id}-${sigRefreshKey}`} />
                          </TableCell>
                        )}
                        {isVoucher && (
                          <TableCell onClick={e => e.stopPropagation()}>
                            <SignVoucherButton
                              transaction={tx}
                              voucherType={type as 'thu' | 'chi'}
                              onSigned={() => setSigRefreshKey(k => k + 1)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          {locked ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                                  Đã duyệt
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Chứng từ đã được ký duyệt, không thể sửa/xóa</TooltipContent>
                            </Tooltip>
                          ) : (
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={(e) => { e.stopPropagation(); handleEdit(tx); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })}
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

              {/* Footer summary */}
              <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Hiển thị {filtered.length}/{transactions.length} chứng từ
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tổng cộng:</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(totalAmount)} ₫
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
