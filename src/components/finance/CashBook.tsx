import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getTransactions, getOpeningBalance, getOrgSettings } from '@/lib/finance-store';
import { BookOpen, Printer, Download } from 'lucide-react';
import { PrintCashBook } from './PrintCashBook';
import { exportCashBookExcel } from '@/lib/export-utils';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

export function CashBook({ refreshKey }: { refreshKey?: number }) {
  const settings = getOrgSettings();
  const data = useMemo(() => {
    const txs = getTransactions();
    const opening = getOpeningBalance();
    let balance = opening;

    const rows = txs
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(tx => {
        const thu = tx.type === 'thu' ? tx.amount : 0;
        const chi = tx.type === 'chi' ? tx.amount : 0;
        balance = balance + thu - chi;
        return { ...tx, thu, chi, balance };
      });

    const totalThu = rows.reduce((s, r) => s + r.thu, 0);
    const totalChi = rows.reduce((s, r) => s + r.chi, 0);

    return { rows, opening, totalThu, totalChi, closing: opening + totalThu - totalChi };
  }, [refreshKey]);

  return (
    <>
      <Card className="border-border shadow-lg no-print">
        <CardHeader className="bg-primary/5 border-b border-border text-center relative">
          <div className="absolute right-4 top-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCashBookExcel}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> In sổ
            </Button>
          </div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">{settings.orgName} - {settings.orgSubName}</p>
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" /> SỔ QUỸ TIỀN MẶT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center w-28">Ngày CT</TableHead>
                  <TableHead className="text-center w-24">Số CT</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-right w-36">Thu</TableHead>
                  <TableHead className="text-right w-36">Chi</TableHead>
                  <TableHead className="text-right w-36">Tồn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell colSpan={3}>Số dư đầu kỳ</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right text-primary">{formatCurrency(data.opening)}</TableCell>
                </TableRow>
                {data.rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-sm">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{row.voucherNo}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{row.description}</TableCell>
                    <TableCell className="text-right text-sm">
                      {row.thu > 0 ? <span className="text-green-600 font-medium">{formatCurrency(row.thu)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {row.chi > 0 ? <span className="text-destructive font-medium">{formatCurrency(row.chi)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatCurrency(row.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2 border-primary/20">
                  <TableCell colSpan={3}>Tổng phát sinh</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(data.totalThu)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(data.totalChi)}</TableCell>
                  <TableCell className="text-right"></TableCell>
                </TableRow>
                <TableRow className="bg-primary/5 font-bold">
                  <TableCell colSpan={3}>Số dư cuối kỳ</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right text-primary text-base">{formatCurrency(data.closing)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-3 text-center text-xs text-muted-foreground p-6 border-t border-border">
            <div>
              <p className="font-semibold uppercase mb-1">Thủ quỹ</p>
              <p>{settings.treasurerName}</p>
            </div>
            <div>
              <p className="font-semibold uppercase mb-1">Phụ trách kế toán</p>
              <p>{settings.accountantName}</p>
            </div>
            <div>
              <p className="font-semibold uppercase mb-1">Lãnh đạo</p>
              <p>{settings.leaderName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="print-only hidden">
        <PrintCashBook refreshKey={refreshKey} />
      </div>
    </>
  );
}
