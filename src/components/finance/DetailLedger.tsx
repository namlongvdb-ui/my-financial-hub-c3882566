import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getTransactions, getOrgSettings } from '@/lib/finance-store';
import { ClipboardList, Printer } from 'lucide-react';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

export function DetailLedger({ refreshKey }: { refreshKey?: number }) {
  const settings = getOrgSettings();
  const rows = useMemo(() => {
    return getTransactions().sort((a, b) => a.date.localeCompare(b.date));
  }, [refreshKey]);

  return (
    <Card className="border-border shadow-lg print-container">
      <CardHeader className="bg-primary/5 border-b border-border text-center relative">
        <Button variant="outline" size="sm" className="absolute right-4 top-4 no-print" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> In sổ
        </Button>
        <p className="text-xs text-muted-foreground tracking-wider uppercase">{settings.orgName} - {settings.orgSubName}</p>
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
                <TableHead className="text-right w-24">Thu</TableHead>
                <TableHead className="text-right w-28">Chi</TableHead>
                <TableHead className="text-center w-16">TK</TableHead>
                <TableHead className="w-28">Họ tên</TableHead>
                <TableHead className="w-40">Đơn vị</TableHead>
                <TableHead className="w-28">Lãnh đạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center text-sm">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{row.voucherNo}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{row.description}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      row.type === 'thu'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {row.type === 'thu' ? 'PT' : 'PC'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {row.type === 'thu' ? <span className="text-green-600">{formatCurrency(row.amount)}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {row.type === 'chi' ? <span className="text-destructive">{formatCurrency(row.amount)}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">{row.accountCode}</TableCell>
                  <TableCell className="text-sm">{row.personName}</TableCell>
                  <TableCell className="text-sm truncate max-w-[10rem]">{row.department}</TableCell>
                  <TableCell className="text-sm">{row.approver}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-10">
                    Chưa có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
